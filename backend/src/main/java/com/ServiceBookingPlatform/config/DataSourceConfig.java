package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jpa.autoconfigure.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Properties;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Bean(name = "publicDataSource")
    public HikariDataSource publicDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(dbUsername);
        config.setPassword(dbPassword);
        // Hosted Postgres has a small connection cap (and the old instance overlaps during a deploy).
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(0);
        config.setIdleTimeout(30_000);
        return new HikariDataSource(config);
    }

    @Bean(name = "publicJdbcTemplate")
    public JdbcTemplate publicJdbcTemplate(@Qualifier("publicDataSource") DataSource publicDataSource) {
        return new JdbcTemplate(publicDataSource);
    }

    @Bean
    @Primary
    public TenantRoutingDataSource tenantRoutingDataSource(
            @Qualifier("publicDataSource") DataSource publicDataSource) {
        TenantRoutingDataSource routing = new TenantRoutingDataSource();
        routing.setDefaultTargetDataSource(publicDataSource);
        routing.setTargetDataSources(new HashMap<>());
        routing.afterPropertiesSet();
        return routing;
    }

    // Factory method for creating a per-tenant HikariCP DataSource.
    // Uses the same DB credentials as publicDataSource but sets search_path to the tenant schema.
    public static DataSource createTenantDataSource(String jdbcUrl, String username,
                                                     String password, String schemaName) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        // Fall back to public so shared tables (e.g. tenants) resolve from tenant connections,
        // e.g. AppointmentService.updateStatus loads the tenant to check ownership.
        // Tenant tables (appointments, services, ...) still win because the schema is first.
        config.setConnectionInitSql("SET search_path TO " + schemaName + ", public");
        // One pool per tenant: keep them tiny and idle-free so many tenants don't exhaust Postgres.
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(0);
        config.setIdleTimeout(30_000);
        config.setInitializationFailTimeout(-1); // don't crash startup if the DB is briefly full
        return new HikariDataSource(config);
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            TenantRoutingDataSource tenantRoutingDataSource,
            JpaProperties jpaProperties) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(tenantRoutingDataSource);
        em.setPackagesToScan("com.ServiceBookingPlatform.entity");
        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(adapter);
        em.setJpaProperties(jpaPropertiesMap(jpaProperties));
        return em;
    }

    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    private Properties jpaPropertiesMap(JpaProperties jpaProperties) {
        Properties props = new Properties();
        props.putAll(jpaProperties.getProperties());
        // Ensure Hibernate uses the dialect from application.properties
        return props;
    }
}

package com.ServiceBookingPlatform.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySourcesPropertyResolver;
import org.springframework.core.io.support.ResourcePropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Guards against shipping secrets or unsafe defaults in application.properties. The resolver sees only the
 * file itself plus the values a test supplies, never the real environment, so these results do not depend
 * on the machine running them.
 */
class ApplicationPropertiesTest {

    private static PropertySourcesPropertyResolver resolver(Map<String, Object> environment) throws IOException {
        MutablePropertySources sources = new MutablePropertySources();
        sources.addLast(new org.springframework.core.env.MapPropertySource("environment", environment));
        sources.addLast(new ResourcePropertySource("classpath:application.properties"));
        return new PropertySourcesPropertyResolver(sources);
    }

    @Test
    void theDatabaseUserHasNoDefault() throws IOException {
        PropertySourcesPropertyResolver withoutEnvironment = resolver(Map.of());

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> withoutEnvironment.getProperty("spring.datasource.username"));
        assertTrue(error.getMessage().contains("DB_USER"), "the error should name the missing variable");
        assertEquals("shop", resolver(Map.of("DB_USER", "shop")).getProperty("spring.datasource.username"));
    }

    @Test
    void theDatabasePasswordHasNoDefault() throws IOException {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> resolver(Map.of()).getProperty("spring.datasource.password"));
        assertTrue(error.getMessage().contains("DB_PASSWORD"));
        assertEquals("pw", resolver(Map.of("DB_PASSWORD", "pw")).getProperty("spring.datasource.password"));
    }

    @Test
    void sqlLoggingIsOffUnlessSwitchedOn() throws IOException {
        assertEquals("false", resolver(Map.of()).getProperty("spring.jpa.show-sql"));
        assertEquals("true", resolver(Map.of("SHOW_SQL", "true")).getProperty("spring.jpa.show-sql"));
    }

    @Test
    void nobodyIsAdminAndNoSigningSecretIsBakedInByDefault() throws IOException {
        PropertySourcesPropertyResolver defaults = resolver(Map.of());

        assertEquals("", defaults.getProperty("app.admin.emails"));
        assertEquals("", defaults.getProperty("app.auth.local.secret"));
        assertEquals("local", defaults.getProperty("app.auth.mode"));
    }

    @Test
    void theFileContainsNoHardcodedEmailAddresses() throws IOException {
        String raw = Files.readString(Path.of("src/main/resources/application.properties"));

        // The shared Resend test sender is the only address allowed: it belongs to no person.
        String withoutSender = raw.replace("onboarding@resend.dev", "");

        assertFalse(Pattern.compile("[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}").matcher(withoutSender).find());
    }

    @Test
    void theEnvironmentTemplateListsTheRequiredVariablesWithoutValues() throws IOException {
        String template = Files.readString(Path.of(".env.example"));

        assertTrue(template.lines().anyMatch(line -> line.equals("DB_USER=")));
        assertTrue(template.lines().anyMatch(line -> line.equals("DB_PASSWORD=")));
        assertTrue(template.lines().anyMatch(line -> line.equals("AUTH_LOCAL_SECRET=")));
        assertTrue(template.lines().anyMatch(line -> line.equals("ADMIN_EMAILS=")));
    }
}

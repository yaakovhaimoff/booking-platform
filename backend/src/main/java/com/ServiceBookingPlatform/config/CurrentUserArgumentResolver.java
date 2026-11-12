package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Lets controllers declare an {@link AuthenticatedUser} parameter. It is null for anonymous callers,
 * which only happens on routes that SecurityConfig leaves public (guest booking, guest reviews).
 */
@Component
@RequiredArgsConstructor
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final AccountService accountService;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return AuthenticatedUser.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            AuthenticatedUser user = AuthenticatedUser.from(token.getToken());
            return user.withAccountId(accountService.resolveAccountId(user.subject()));
        }
        return null;
    }
}

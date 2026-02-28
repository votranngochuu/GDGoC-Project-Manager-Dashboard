package com.gdgoc.dashboard.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gdgocOpenAPI() {
        final String securitySchemeName = "Firebase JWT";

        return new OpenAPI()
                .info(new Info()
                        .title("GDGoC Performance Dashboard API")
                        .description("REST API for GDGoC Project Manager & Performance Dashboard. "
                                + "Supports project management, task tracking, contribution scoring, "
                                + "and role-based dashboards (Admin / Leader / Member).")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("GDGoC FPTU")
                                .url("https://github.com/votranngochuu/GDGoC-Project-Manager-Dashboard")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Firebase ID Token (obtained via Google Sign-In)")));
    }
}

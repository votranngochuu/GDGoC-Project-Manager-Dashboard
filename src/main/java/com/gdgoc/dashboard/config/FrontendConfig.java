package com.gdgoc.dashboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serve frontend static files from project directory "frontend/".
 * When running with context-path /gdgoc_dashboard, open:
 * http://localhost:8080/gdgoc_dashboard/ or http://localhost:8080/gdgoc_dashboard/index.html
 */
@Configuration
public class FrontendConfig implements WebMvcConfigurer {

    @Value("${app.frontend.path:frontend}")
    private String frontendPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path base = Paths.get("").toAbsolutePath().resolve(frontendPath);
        String location = base.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/**")
                .addResourceLocations(location)
                .setCachePeriod(0);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}

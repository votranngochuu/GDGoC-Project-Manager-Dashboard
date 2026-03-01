package com.gdgoc.dashboard.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Serves env.js so the frontend gets BACKEND_URL and Firebase config from the server.
 * Frontend imports: import { env } from './env.js'
 * When running from same origin, BACKEND_URL is relative so API calls work without CORS.
 */
@RestController
public class EnvController {

    @Value("${app.frontend.backend-url:/gdgoc_dashboard/api}")
    private String backendUrl;

    @Value("${app.frontend.firebase.api-key:}")
    private String firebaseApiKey;
    @Value("${app.frontend.firebase.auth-domain:}")
    private String firebaseAuthDomain;
    @Value("${app.frontend.firebase.project-id:}")
    private String firebaseProjectId;
    @Value("${app.frontend.firebase.storage-bucket:}")
    private String firebaseStorageBucket;
    @Value("${app.frontend.firebase.messaging-sender-id:}")
    private String firebaseMessagingSenderId;
    @Value("${app.frontend.firebase.app-id:}")
    private String firebaseAppId;
    @Value("${app.frontend.firebase.measurement-id:}")
    private String firebaseMeasurementId;

    @GetMapping(value = "/env.js", produces = "application/javascript")
    public ResponseEntity<String> envJs() {
        // Return as JavaScript module so: import { env } from './env.js' works
        String js = """
            export const env = {
              BACKEND_URL: "%s",
              FIREBASE_API_KEY: "%s",
              FIREBASE_AUTH_DOMAIN: "%s",
              FIREBASE_PROJECT_ID: "%s",
              FIREBASE_STORAGE_BUCKET: "%s",
              FIREBASE_MESSAGING_SENDER_ID: "%s",
              FIREBASE_APP_ID: "%s",
              FIREBASE_MEASUREMENT_ID: "%s"
            };
            """
                .formatted(
                    escapeJs(backendUrl),
                    escapeJs(firebaseApiKey),
                    escapeJs(firebaseAuthDomain),
                    escapeJs(firebaseProjectId),
                    escapeJs(firebaseStorageBucket),
                    escapeJs(firebaseMessagingSenderId),
                    escapeJs(firebaseAppId),
                    escapeJs(firebaseMeasurementId)
                )
                .trim();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/javascript; charset=UTF-8"))
                .body(js);
    }

    private static String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}

package com.gdgoc.dashboard.controller;

import com.gdgoc.dashboard.dto.response.DashboardAdminResponse;
import com.gdgoc.dashboard.dto.response.DashboardLeaderResponse;
import com.gdgoc.dashboard.dto.response.DashboardMemberResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.security.CurrentUser;
import com.gdgoc.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardAdminResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/leader/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LEADER')")
    public ResponseEntity<DashboardLeaderResponse> getLeaderDashboard(@PathVariable UUID projectId,
            @CurrentUser User currentUser) {
        return ResponseEntity.ok(dashboardService.getLeaderDashboard(projectId, currentUser));
    }

    @GetMapping("/member")
    public ResponseEntity<DashboardMemberResponse> getMemberDashboard(@CurrentUser User currentUser) {
        return ResponseEntity.ok(dashboardService.getMemberDashboard(currentUser));
    }
}

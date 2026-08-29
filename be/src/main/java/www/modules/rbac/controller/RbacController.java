package www.modules.rbac.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import www.model.dto.response.ApiResponse;
import www.modules.rbac.dto.RbacDtos.PermissionMatrix;
import www.modules.rbac.dto.RbacDtos.UpdateMatrixRequest;
import www.modules.rbac.dto.RbacDtos.UpdateRolePermissionsRequest;
import www.modules.rbac.model.*;
import www.modules.rbac.service.RbacService;
import www.security.CustomUserDetailsService.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class RbacController {
    private final RbacService rbacService;

    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<Role>>> roles() {
        return ResponseEntity.ok(ApiResponse.success(rbacService.roles()));
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<Permission>>> permissions() {
        return ResponseEntity.ok(ApiResponse.success(rbacService.permissions()));
    }

    @GetMapping("/roles/{roleCode}/permissions")
    public ResponseEntity<ApiResponse<List<RolePermission>>> rolePermissions(@PathVariable String roleCode) {
        return ResponseEntity.ok(ApiResponse.success(rbacService.rolePermissions(roleCode)));
    }

    @GetMapping("/role-permissions/matrix")
    public ResponseEntity<ApiResponse<PermissionMatrix>> matrix() {
        return ResponseEntity.ok(ApiResponse.success(rbacService.matrix()));
    }

    @PutMapping("/role-permissions/matrix")
    public ResponseEntity<ApiResponse<PermissionMatrix>> updateMatrix(
            @Valid @RequestBody UpdateMatrixRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Matrix updated",
                rbacService.updateMatrix(request, userId(authentication))));
    }

    @PutMapping("/roles/{roleCode}/permissions")
    public ResponseEntity<ApiResponse<List<RolePermission>>> update(
            @PathVariable String roleCode,
            @Valid @RequestBody UpdateRolePermissionsRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Permissions updated",
                rbacService.updateRolePermissions(roleCode, request, userId(authentication))));
    }

    @PostMapping("/roles/{roleCode}/permissions/{permissionCode}/enable")
    public ResponseEntity<ApiResponse<RolePermission>> enable(
            @PathVariable String roleCode,
            @PathVariable String permissionCode,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(rbacService.setPermission(
                roleCode, permissionCode, true, userId(authentication), reason)));
    }

    @PostMapping("/roles/{roleCode}/permissions/{permissionCode}/disable")
    public ResponseEntity<ApiResponse<RolePermission>> disable(
            @PathVariable String roleCode,
            @PathVariable String permissionCode,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(rbacService.setPermission(
                roleCode, permissionCode, false, userId(authentication), reason)));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> auditLogs() {
        return ResponseEntity.ok(ApiResponse.success(rbacService.auditLogs()));
    }

    private String userId(Authentication authentication) {
        return authentication == null ? "system" : ((UserPrincipal) authentication.getPrincipal()).getId();
    }
}

package www.modules.rbac.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;
import www.modules.common.EcommerceEnums.PermissionGroup;
import www.modules.rbac.dto.RbacDtos.*;
import www.modules.rbac.model.*;
import www.modules.rbac.repository.*;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RbacService {
    private static final List<String> SYSTEM_ROLES = List.of("CUSTOMER", "STAFF", "SHOP_MANAGER", "ADMIN", "SUPER_ADMIN");
    private static final List<String> PERMISSIONS = List.of(
            "CATALOG_READ", "CATALOG_CREATE", "CATALOG_UPDATE", "CATALOG_DELETE", "CATALOG_APPROVE",
            "INVENTORY_READ", "INVENTORY_UPDATE", "ORDER_READ", "ORDER_UPDATE", "ORDER_CANCEL",
            "PAYMENT_READ", "PAYMENT_REFUND", "RETURN_READ", "RETURN_PROCESS", "REVIEW_MODERATE",
            "USER_READ", "USER_UPDATE", "USER_DISABLE", "REPORT_READ", "SYSTEM_SETTINGS",
            "MANAGE_ROLE_PERMISSIONS", "AUDIT_LOG_READ"
    );

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PermissionCacheService permissionCacheService;

    @PostConstruct
    public void seedDefaults() {
        try {
            LocalDateTime now = LocalDateTime.now();
            for (String role : SYSTEM_ROLES) {
                roleRepository.findByCode(role).orElseGet(() -> roleRepository.save(Role.builder()
                        .code(role).name(role).description(role + " role")
                        .createdAt(now).updatedAt(now).build()));
            }
            for (String permission : PERMISSIONS) {
                permissionRepository.findByCode(permission).orElseGet(() -> permissionRepository.save(Permission.builder()
                        .code(permission)
                        .name(permission.replace('_', ' '))
                        .group(groupFor(permission))
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
            }
            for (String permission : PERMISSIONS) {
                ensureRolePermission("SUPER_ADMIN", permission, true, "system");
            }
            seedRoleDefaults();
        } catch (DataAccessException e) {
            log.warn("Skip RBAC default seed because database is not ready: {}", e.getMessage());
        }
    }

    public List<Role> roles() {
        return roleRepository.findAll();
    }

    public List<Permission> permissions() {
        return permissionRepository.findAll();
    }

    public List<AuditLog> auditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    public PermissionMatrix matrix() {
        List<String> roles = roleRepository.findAll().stream().map(Role::getCode).sorted().toList();
        List<PermissionMatrixRow> rows = permissionRepository.findAll().stream()
                .sorted(Comparator.comparing(Permission::getCode))
                .map(permission -> {
                    Map<String, Boolean> enabled = new LinkedHashMap<>();
                    for (String role : roles) {
                        enabled.put(role, isEnabled(role, permission.getCode()));
                    }
                    return PermissionMatrixRow.builder()
                            .code(permission.getCode())
                            .group(permission.getGroup() != null ? permission.getGroup().name() : "SYSTEM")
                            .enabledByRole(enabled)
                            .build();
                })
                .toList();
        return PermissionMatrix.builder().roles(roles).permissions(rows).build();
    }

    public List<RolePermission> rolePermissions(String roleCode) {
        return rolePermissionRepository.findByRoleCode(roleCode);
    }

    public PermissionMatrix updateMatrix(UpdateMatrixRequest request, String actorId) {
        for (Map.Entry<String, List<PermissionToggle>> entry : request.getChangesByRole().entrySet()) {
            UpdateRolePermissionsRequest roleRequest = new UpdateRolePermissionsRequest();
            roleRequest.setPermissions(entry.getValue());
            roleRequest.setReason(request.getReason());
            updateRolePermissions(entry.getKey(), roleRequest, actorId);
        }
        return matrix();
    }

    public RolePermission setPermission(String roleCode, String permissionCode, boolean enabled, String actorId, String reason) {
        UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest();
        PermissionToggle toggle = new PermissionToggle();
        toggle.setCode(permissionCode);
        toggle.setEnabled(enabled);
        request.setPermissions(List.of(toggle));
        request.setReason(reason);
        return updateRolePermissions(roleCode, request, actorId).get(0);
    }

    public List<RolePermission> updateRolePermissions(String roleCode, UpdateRolePermissionsRequest request, String actorId) {
        if ("SUPER_ADMIN".equals(roleCode)) {
            boolean disablesCritical = request.getPermissions().stream()
                    .anyMatch(p -> "MANAGE_ROLE_PERMISSIONS".equals(p.getCode()) && Boolean.FALSE.equals(p.getEnabled()));
            if (disablesCritical) {
                throw new BadRequestException("Cannot disable MANAGE_ROLE_PERMISSIONS for SUPER_ADMIN");
            }
        }
        List<RolePermission> updated = new ArrayList<>();
        for (PermissionToggle toggle : request.getPermissions()) {
            RolePermission before = rolePermissionRepository.findByRoleCodeAndPermissionCode(roleCode, toggle.getCode()).orElse(null);
            RolePermission after = ensureRolePermission(roleCode, toggle.getCode(), Boolean.TRUE.equals(toggle.getEnabled()), actorId);
            auditLogRepository.save(AuditLog.builder()
                    .actorId(actorId)
                    .action("UPDATE_ROLE_PERMISSION")
                    .targetType("ROLE_PERMISSION")
                    .targetId(roleCode + ":" + toggle.getCode())
                    .beforeValue(before == null ? "null" : String.valueOf(before.getEnabled()))
                    .afterValue(String.valueOf(after.getEnabled()))
                    .reason(request.getReason())
                    .createdAt(LocalDateTime.now())
                    .build());
            updated.add(after);
        }
        permissionCacheService.invalidate(roleCode);
        return updated;
    }

    public boolean hasPermission(String roleCode, String permissionCode) {
        return permissionsForRole(roleCode).contains(permissionCode);
    }

    public List<String> permissionsForRole(String roleCode) {
        List<String> cached = permissionCacheService.getCached(roleCode);
        if (cached != null) {
            return cached;
        }
        List<String> permissions;
        if ("SUPER_ADMIN".equals(roleCode)) {
            permissions = PERMISSIONS;
        } else {
            permissions = rolePermissionRepository.findByRoleCode(roleCode).stream()
                    .filter(rp -> Boolean.TRUE.equals(rp.getEnabled()))
                    .map(RolePermission::getPermissionCode)
                    .sorted()
                    .toList();
        }
        permissionCacheService.put(roleCode, permissions);
        return permissions;
    }

    private void seedRoleDefaults() {
        List<String> staffPerms = List.of(
                "CATALOG_READ", "CATALOG_CREATE", "CATALOG_UPDATE",
                "INVENTORY_READ", "ORDER_READ", "ORDER_UPDATE",
                "RETURN_READ", "REVIEW_MODERATE");
        List<String> shopManagerPerms = List.of(
                "CATALOG_READ", "CATALOG_CREATE", "CATALOG_UPDATE", "CATALOG_APPROVE",
                "INVENTORY_READ", "INVENTORY_UPDATE", "ORDER_READ", "ORDER_UPDATE", "ORDER_CANCEL",
                "RETURN_READ", "RETURN_PROCESS", "REVIEW_MODERATE", "REPORT_READ");
        List<String> adminPerms = PERMISSIONS.stream()
                .filter(p -> !"MANAGE_ROLE_PERMISSIONS".equals(p) && !"AUDIT_LOG_READ".equals(p))
                .toList();
        staffPerms.forEach(p -> ensureRolePermission("STAFF", p, true, "system"));
        shopManagerPerms.forEach(p -> ensureRolePermission("SHOP_MANAGER", p, true, "system"));
        adminPerms.forEach(p -> ensureRolePermission("ADMIN", p, true, "system"));
    }

    private RolePermission ensureRolePermission(String roleCode, String permissionCode, boolean enabled, String actorId) {
        RolePermission rolePermission = rolePermissionRepository
                .findByRoleCodeAndPermissionCode(roleCode, permissionCode)
                .orElse(RolePermission.builder().roleCode(roleCode).permissionCode(permissionCode).build());
        rolePermission.setEnabled(enabled);
        rolePermission.setUpdatedBy(actorId);
        rolePermission.setUpdatedAt(LocalDateTime.now());
        return rolePermissionRepository.save(rolePermission);
    }

    private boolean isEnabled(String role, String permission) {
        return "SUPER_ADMIN".equals(role) || rolePermissionRepository.findByRoleCodeAndPermissionCode(role, permission)
                .map(RolePermission::getEnabled)
                .orElse(false);
    }

    private PermissionGroup groupFor(String code) {
        String prefix = code.split("_")[0];
        try {
            return PermissionGroup.valueOf(prefix);
        } catch (Exception ignored) {
            return PermissionGroup.SYSTEM;
        }
    }
}

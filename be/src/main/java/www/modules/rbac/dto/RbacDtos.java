package www.modules.rbac.dto;

import lombok.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class RbacDtos {
    private RbacDtos() {}

    @Data
    public static class PermissionToggle {
        private String code;
        private Boolean enabled;
    }

    @Data
    public static class UpdateRolePermissionsRequest {
        private List<PermissionToggle> permissions;
        private String reason;
    }

    @Data
    @Builder
    public static class PermissionMatrixRow {
        private String code;
        private String group;
        private Map<String, Boolean> enabledByRole;
    }

    @Data
    @Builder
    public static class PermissionMatrix {
        private List<String> roles;
        private List<PermissionMatrixRow> permissions;
    }

    @Data
    public static class UpdateMatrixRequest {
        private Map<String, List<PermissionToggle>> changesByRole = new LinkedHashMap<>();
        private String reason;
    }
}

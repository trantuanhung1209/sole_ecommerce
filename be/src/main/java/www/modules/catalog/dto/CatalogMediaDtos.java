package www.modules.catalog.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

public final class CatalogMediaDtos {
    private CatalogMediaDtos() {}

    @Data
    public static class UploadImagesRequest {
        @NotEmpty
        @Size(max = 8)
        private List<String> images = new ArrayList<>();
    }
}

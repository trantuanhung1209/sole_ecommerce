package www.modules.catalog.dto;

import lombok.Data;
import www.modules.common.EcommerceEnums.GenderTarget;

@Data
public class ProductFilter {
    private String search;
    private String brandId;
    private String categoryId;
    private GenderTarget gender;
    private Double minPrice;
    private Double maxPrice;
    private String size;
    private String color;
    private Boolean inStock;
    /** newest | price_asc | price_desc | rating */
    private String sort;
}

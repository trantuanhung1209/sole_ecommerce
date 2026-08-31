package www.modules.ai.service;

import www.modules.ai.dto.VisionAnalysis;

public final class ImageSearchResponses {
    private ImageSearchResponses() {}

    public static String noMatchAnswer(VisionAnalysis vision) {
        String summary = vision != null ? vision.friendlySummary() : "mẫu giày trong ảnh";
        return "Mình đã xem ảnh bạn gửi — có vẻ là **" + summary + "**. "
                + "Hiện SOLE **chưa có** mẫu này trong catalog.\n\n"
                + "Bạn có thể khám phá thêm tại trang **Sản phẩm**, hoặc gửi tên thương hiệu/mẫu khác để mình hỗ trợ tìm nhé!";
    }

    public static String noMatchWarning(VisionAnalysis vision) {
        if (vision != null && vision.isBrandIdentified() && hasText(vision.getBrand())) {
            return "Chưa có " + vision.shortLabel() + " trong catalog SOLE.";
        }
        return "Không tìm thấy mẫu tương ứng trong catalog SOLE.";
    }

    public static String exactMatchAnswer(VisionAnalysis vision) {
        String summary = vision != null ? vision.friendlySummary() : "ảnh bạn gửi";
        return "Mình tìm thấy một số mẫu **giống " + summary + "** trong catalog SOLE. Xem gợi ý bên dưới nhé!";
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

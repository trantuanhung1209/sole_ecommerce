package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.dto.VisionAnalysis;
import www.modules.ai.service.ImageSearchResponses;

import static org.junit.jupiter.api.Assertions.*;

class ImageSearchResponsesTest {

    @Test
    void noMatchAnswerUsesShortSummaryNotFullDescription() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .style("sneaker chunky")
                .color("xám bạc")
                .description("Đôi giày thể thao có thiết kế hiện đại với phần đế dày và chất liệu màu xám bạc. "
                        + "Nó có nhiều chi tiết nổi tạo sự cá tính và chắc chắn.")
                .build();

        String answer = ImageSearchResponses.noMatchAnswer(vision);

        assertTrue(answer.contains("sneaker chunky màu xám bạc"));
        assertFalse(answer.contains("Nó có nhiều chi tiết"));
        assertFalse(answer.contains("Mình chưa tạo được"));
    }

    @Test
    void noMatchWarningStaysShortWhenBrandUnknown() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .style("sneaker chunky")
                .color("xám bạc")
                .description("Đôi giày thể thao có thiết kế hiện đại...")
                .brandIdentified(false)
                .build();

        String warning = ImageSearchResponses.noMatchWarning(vision);

        assertEquals("Không tìm thấy mẫu tương ứng trong catalog SOLE.", warning);
    }

    @Test
    void noMatchWarningUsesBrandWhenIdentified() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .brand("MLB")
                .model("Chunky Liner")
                .brandIdentified(true)
                .build();

        assertEquals("Chưa có MLB Chunky Liner trong catalog SOLE.",
                ImageSearchResponses.noMatchWarning(vision));
    }
}

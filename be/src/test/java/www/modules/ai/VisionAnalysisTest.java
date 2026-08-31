package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.dto.VisionAnalysis;

import static org.junit.jupiter.api.Assertions.*;

class VisionAnalysisTest {

    @Test
    void shortLabelPrefersStyleAndColorOverDescription() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .style("sneaker chunky")
                .color("xám bạc")
                .description("Đôi giày thể thao có thiết kế hiện đại với phần đế dày...")
                .build();

        assertEquals("sneaker chunky xám bạc", vision.shortLabel());
    }

    @Test
    void friendlySummaryCombinesStyleAndColor() {
        VisionAnalysis vision = VisionAnalysis.builder()
                .style("sneaker chunky")
                .color("xám bạc")
                .description("Đôi giày thể thao có thiết kế hiện đại...")
                .build();

        assertEquals("sneaker chunky màu xám bạc", vision.friendlySummary());
    }
}

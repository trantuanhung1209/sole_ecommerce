package www.modules.ai;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import www.modules.ai.service.ImageNormalizer;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ImageNormalizerTest {

    @Test
    void normalizesPngToWebpBytes() throws Exception {
        ImageNormalizer normalizer = new ImageNormalizer();
        ReflectionTestUtils.setField(normalizer, "webpQuality", 85f);
        ReflectionTestUtils.setField(normalizer, "maxDimension", 4096);

        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        ImageIO.write(image, "png", pngOut);

        ImageNormalizer.NormalizedImage result = normalizer.normalizeToWebp(pngOut.toByteArray());

        assertNotNull(result.webpBytes());
        assertTrue(result.webpBytes().length > 0);
        assertEquals(10, result.width());
        assertEquals(10, result.height());
    }

    @Test
    void passesThroughWebpInput() throws Exception {
        ImageIO.scanForPlugins();
        var writers = ImageIO.getImageWritersByMIMEType("image/webp");
        if (!writers.hasNext()) {
            return;
        }

        ImageNormalizer normalizer = new ImageNormalizer();
        ReflectionTestUtils.setField(normalizer, "webpQuality", 85f);
        ReflectionTestUtils.setField(normalizer, "maxDimension", 4096);

        BufferedImage image = new BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream webpOut = new ByteArrayOutputStream();
        ImageWriter writer = writers.next();
        try (var ios = ImageIO.createImageOutputStream(webpOut)) {
            writer.setOutput(ios);
            writer.write(image);
        } finally {
            writer.dispose();
        }

        byte[] webpBytes = webpOut.toByteArray();
        ImageNormalizer.NormalizedImage result = normalizer.normalizeToWebp(webpBytes);

        assertArrayEquals(webpBytes, result.webpBytes());
        assertEquals(12, result.width());
        assertEquals(12, result.height());
    }
}

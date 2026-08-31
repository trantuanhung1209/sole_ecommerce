package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.service.ImageFormatDetector;
import www.modules.ai.service.ImageFormatDetector.ImageFormat;

import static org.junit.jupiter.api.Assertions.*;

class ImageFormatDetectorTest {

    @Test
    void detectsJpegFromMagicBytes() {
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
        assertEquals(ImageFormat.JPEG, ImageFormatDetector.detect(jpeg));
    }

    @Test
    void detectsPngFromMagicBytes() {
        byte[] png = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        assertEquals(ImageFormat.PNG, ImageFormatDetector.detect(png));
    }

    @Test
    void detectsWebpFromMagicBytes() {
        byte[] webp = "RIFF____WEBP".getBytes();
        assertEquals(ImageFormat.WEBP, ImageFormatDetector.detect(webp));
    }

    @Test
    void rejectsPdfDisguisedAsImage() {
        byte[] pdf = "%PDF-1.4".getBytes();
        assertEquals(ImageFormat.UNKNOWN, ImageFormatDetector.detect(pdf));
    }
}

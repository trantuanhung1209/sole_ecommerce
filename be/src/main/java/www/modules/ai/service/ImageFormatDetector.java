package www.modules.ai.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;

public final class ImageFormatDetector {

    public enum ImageFormat {
        JPEG, PNG, WEBP, GIF, BMP, TIFF, HEIC, UNKNOWN
    }

    private ImageFormatDetector() {}

    public static ImageFormat detect(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return ImageFormat.UNKNOWN;
        }
        if (isJpeg(bytes)) return ImageFormat.JPEG;
        if (isPng(bytes)) return ImageFormat.PNG;
        if (isWebp(bytes)) return ImageFormat.WEBP;
        if (isGif(bytes)) return ImageFormat.GIF;
        if (isBmp(bytes)) return ImageFormat.BMP;
        if (isTiff(bytes)) return ImageFormat.TIFF;
        if (isHeic(bytes)) return ImageFormat.HEIC;
        return ImageFormat.UNKNOWN;
    }

    public static String mimeType(ImageFormat format) {
        return switch (format) {
            case JPEG -> "image/jpeg";
            case PNG -> "image/png";
            case WEBP -> "image/webp";
            case GIF -> "image/gif";
            case BMP -> "image/bmp";
            case TIFF -> "image/tiff";
            case HEIC -> "image/heic";
            default -> "application/octet-stream";
        };
    }

    public static Optional<String> extension(ImageFormat format) {
        return switch (format) {
            case JPEG -> Optional.of("jpg");
            case PNG -> Optional.of("png");
            case WEBP -> Optional.of("webp");
            case GIF -> Optional.of("gif");
            case BMP -> Optional.of("bmp");
            case TIFF -> Optional.of("tiff");
            case HEIC -> Optional.of("heic");
            default -> Optional.empty();
        };
    }

    private static boolean isJpeg(byte[] b) {
        return (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8;
    }

    private static boolean isPng(byte[] b) {
        return b[0] == (byte) 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
    }

    private static boolean isGif(byte[] b) {
        return b[0] == 'G' && b[1] == 'I' && b[2] == 'F';
    }

    private static boolean isBmp(byte[] b) {
        return b[0] == 'B' && b[1] == 'M';
    }

    private static boolean isTiff(byte[] b) {
        return (b[0] == 'I' && b[1] == 'I') || (b[0] == 'M' && b[1] == 'M');
    }

    private static boolean isWebp(byte[] b) {
        return b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
    }

    private static boolean isHeic(byte[] b) {
        if (b.length < 12) {
            return false;
        }
        String brand = new String(b, 4, 4, StandardCharsets.US_ASCII);
        if (!"ftyp".equals(brand)) {
            return false;
        }
        String subtype = new String(b, 8, 4, StandardCharsets.US_ASCII).toLowerCase(Locale.ROOT);
        return subtype.contains("heic") || subtype.contains("heif") || subtype.contains("mif1");
    }
}

package www.modules.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import www.exception.BadRequestException;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

@Service
@Slf4j
public class ImageNormalizer {

    @Value("${ai.image.webp-quality:85}")
    private float webpQuality;

    @Value("${ai.image.max-dimension:4096}")
    private int maxDimension;

    public record NormalizedImage(byte[] webpBytes, int width, int height) {}

    public NormalizedImage normalizeToWebp(byte[] inputBytes) {
        try {
            ImageFormatDetector.ImageFormat format = ImageFormatDetector.detect(inputBytes);
            if (format == ImageFormatDetector.ImageFormat.UNKNOWN) {
                throw new BadRequestException("Định dạng ảnh không được hỗ trợ.");
            }

            if (format == ImageFormatDetector.ImageFormat.WEBP) {
                return normalizeWebpInput(inputBytes);
            }

            BufferedImage image = readImage(inputBytes, format);
            if (image == null) {
                throw new BadRequestException("Không thể đọc ảnh. Vui lòng thử JPEG, PNG hoặc WebP.");
            }
            BufferedImage rgb = toRgb(image);
            BufferedImage resized = resizeIfNeeded(rgb);
            byte[] webp = encodeWebp(resized);
            return new NormalizedImage(webp, resized.getWidth(), resized.getHeight());
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Image normalization failed", ex);
            throw new BadRequestException("Không thể xử lý ảnh. Vui lòng thử lại với JPEG, PNG hoặc WebP.");
        }
    }

    private NormalizedImage normalizeWebpInput(byte[] inputBytes) throws Exception {
        BufferedImage image = readImage(inputBytes, ImageFormatDetector.ImageFormat.WEBP);
        if (image == null) {
            // Magic bytes are WebP but reader unavailable — pass through for Cloudinary
            return new NormalizedImage(inputBytes, 0, 0);
        }
        if (Math.max(image.getWidth(), image.getHeight()) <= maxDimension) {
            return new NormalizedImage(inputBytes, image.getWidth(), image.getHeight());
        }
        BufferedImage resized = resizeIfNeeded(toRgb(image));
        return new NormalizedImage(encodeWebp(resized), resized.getWidth(), resized.getHeight());
    }

    private BufferedImage readImage(byte[] inputBytes, ImageFormatDetector.ImageFormat format) throws IOException {
        String formatName = readerFormatName(format);
        if (formatName != null) {
            BufferedImage image = readWithFormat(inputBytes, formatName);
            if (image != null) {
                return image;
            }
        }
        try (ByteArrayInputStream in = new ByteArrayInputStream(inputBytes)) {
            return ImageIO.read(in);
        }
    }

    private String readerFormatName(ImageFormatDetector.ImageFormat format) {
        return switch (format) {
            case JPEG -> "jpeg";
            case PNG -> "png";
            case WEBP -> "webp";
            case GIF -> "gif";
            case BMP -> "bmp";
            case TIFF -> "tiff";
            case HEIC -> "heif";
            default -> null;
        };
    }

    private BufferedImage readWithFormat(byte[] bytes, String formatName) throws IOException {
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName(formatName);
        while (readers.hasNext()) {
            ImageReader reader = readers.next();
            try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                reader.setInput(stream, true);
                return reader.read(0);
            } catch (Exception ex) {
                log.debug("ImageReader '{}' failed: {}", formatName, ex.getMessage());
            } finally {
                reader.dispose();
            }
        }
        return null;
    }

    private BufferedImage toRgb(BufferedImage source) {
        if (source.getType() == BufferedImage.TYPE_INT_RGB) {
            return source;
        }
        BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(source, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private BufferedImage resizeIfNeeded(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        int max = Math.max(width, height);
        if (max <= maxDimension) {
            return image;
        }
        double scale = (double) maxDimension / max;
        int newW = (int) Math.round(width * scale);
        int newH = (int) Math.round(height * scale);
        Image scaled = image.getScaledInstance(newW, newH, Image.SCALE_SMOOTH);
        BufferedImage output = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = output.createGraphics();
        g.drawImage(scaled, 0, 0, null);
        g.dispose();
        return output;
    }

    private byte[] encodeWebp(BufferedImage image) throws Exception {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
        if (!writers.hasNext()) {
            return encodePngFallback(image);
        }
        ImageWriter writer = writers.next();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(webpQuality / 100f);
            }
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private byte[] encodePngFallback(BufferedImage image) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}

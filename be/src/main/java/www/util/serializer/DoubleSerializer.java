package www.util.serializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.text.DecimalFormat;

/**
 * Custom Jackson serializer for Double values to prevent scientific notation
 */
public class DoubleSerializer extends JsonSerializer<Double> {
    
    private static final DecimalFormat DECIMAL_FORMAT = new DecimalFormat("#");
    
    @Override
    public void serialize(Double value, JsonGenerator gen, SerializerProvider serializers) 
            throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            // Format the double without scientific notation
            String formattedValue = DECIMAL_FORMAT.format(value);
            // Write as number, not string
            gen.writeNumber(formattedValue);
        }
    }
}
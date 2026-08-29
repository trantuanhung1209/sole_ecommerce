package www.modules.ai;

import org.junit.jupiter.api.Test;
import www.modules.ai.util.VectorUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VectorUtilsTest {
    @Test
    void cosineSimilarity_identicalVectors() {
        List<Double> vector = List.of(1.0, 0.0, 0.0);
        assertEquals(1.0, VectorUtils.cosineSimilarity(vector, vector), 0.0001);
    }

    @Test
    void cosineSimilarity_orthogonalVectors() {
        assertEquals(0.0, VectorUtils.cosineSimilarity(List.of(1.0, 0.0), List.of(0.0, 1.0)), 0.0001);
    }

    @Test
    void cosineSimilarity_emptyReturnsZero() {
        assertEquals(0.0, VectorUtils.cosineSimilarity(List.of(), List.of(1.0)));
        assertTrue(VectorUtils.cosineSimilarity(List.of(1.0), List.of(1.0, 2.0)) == 0);
    }
}

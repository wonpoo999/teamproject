package com.example.health_care.service;

import com.example.health_care.config.FoodClient;
import com.example.health_care.dto.FoodDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.*;

/// 식품 영양성분 정보 서비스
@Service
public class FoodService {

    private static final List<String> NAME_KEYS = List.of("foodNm", "foodName", "desc_kor", "DESC_KOR", "식품명");
    private static final List<String> KCAL_KEYS = List.of("enerc", "kcal", "NUTR_CONT1", "에너지(kcal)", "에너지(KCAL)",
            "에너지kcal");

    private final FoodClient client;
    private final ObjectMapper om = new ObjectMapper();

    public FoodService(FoodClient client) {
        this.client = client;
    }

    // 식품명으로 영양성분 정보 검색

    public List<FoodDTO> searchSimple(String name, int page, int perPage) {
        String q = name == null ? "" : name.trim();
        if (q.isEmpty())
            return List.of();

        int pageSafe = Math.max(1, page);
        int perPageSafe = Math.min(Math.max(1, perPage), 50);

        try {
            String body = client.searchByName(q, pageSafe, perPageSafe);
            // ✅ 추가할 로그: 공공데이터 API로부터 받은 원본 응답 확인
            System.out.println("➡️ 공공데이터 API 응답: " + body);
            JsonNode root = om.readTree(body);

            // API 응답 에러 체크
            JsonNode header = root.path("response").path("header");
            String resultCode = header.path("resultCode").asText("");
            if (!resultCode.isBlank() && !"00".equals(resultCode)) {
                String msg = header.path("resultMsg").asText("");
                throw new IllegalStateException("공공데이터 오류: " + resultCode + " / " + msg);
            }

            Map<String, FoodDTO> dedup = new LinkedHashMap<>();

            JsonNode records = root.path("records");
            if (records.isArray() && records.size() > 0) {
                for (JsonNode n : records)
                    addIfPresent(dedup, n);
            } else {
                JsonNode data = root.path("data");
                if (data.isArray() && data.size() > 0) {
                    for (JsonNode n : data)
                        addIfPresent(dedup, n);
                } else {
                    JsonNode items = root.path("response").path("body").path("items").path("item");
                    if (items.isArray()) {
                        for (JsonNode n : items)
                            addIfPresent(dedup, n);
                    } else if (items.isObject()) {
                        addIfPresent(dedup, items);
                    } else {
                        for (JsonNode n : findParentsAny(root, NAME_KEYS))
                            addIfPresent(dedup, n);
                        for (JsonNode n : findParentsAny(root, KCAL_KEYS))
                            addIfPresent(dedup, n);
                    }
                }
            }
            return new ArrayList<>(dedup.values());

        } catch (Exception e) {
            String msg = e.getMessage() == null ? e.toString() : e.getMessage();
            throw new IllegalStateException("공공데이터 파싱 실패: " + msg, e);
        }
    }

    // JSON 노드에서 식품 정보 추출하여 맵에 추가
    private void addIfPresent(Map<String, FoodDTO> out, JsonNode n) {
        if (n == null || n.isNull())
            return;
        String name = firstText(n, NAME_KEYS);
        if (name.isBlank())
            return;
        Double kcal = firstNumber(n, KCAL_KEYS);
        if (kcal == null)
            return;
        out.putIfAbsent(name, FoodDTO.builder().foodNm(name).enerc(kcal).build());
    }

    // 여러 키 중에서 첫 번째로 찾은 텍스트 값 반환
    private static String firstText(JsonNode n, List<String> keys) {
        for (String k : keys) {
            JsonNode v = n.get(k);
            if (v != null && !v.isNull()) {
                String s = v.asText("").trim();
                if (!s.isEmpty())
                    return s;
            }
        }
        return "";
    }

    // 여러 키 중에서 첫 번째로 찾은 숫자 값 반환
    private static Double firstNumber(JsonNode n, List<String> keys) {
        for (String k : keys) {
            JsonNode v = n.get(k);
            if (v == null || v.isNull())
                continue;
            try {
                if (v.isNumber())
                    return v.doubleValue();
                String raw = v.asText("").trim();
                if (raw.isEmpty())
                    continue;
                raw = raw.replace(",", "");
                StringBuilder sb = new StringBuilder();
                boolean dot = false, sign = false;
                for (char c : raw.toCharArray()) {
                    if (Character.isDigit(c))
                        sb.append(c);
                    else if (c == '.' && !dot) {
                        dot = true;
                        sb.append(c);
                    } else if ((c == '+' || c == '-') && !sign && sb.length() == 0) {
                        sign = true;
                        sb.append(c);
                    } else if (sb.length() > 0)
                        break;
                }
                if (sb.length() > 0)
                    return Double.valueOf(sb.toString());
            } catch (Exception ignore) {
            }
        }
        return null;
    }

    // 여러 키 중 하나라도 포함하는 부모 노드들 찾기

    private static Collection<JsonNode> findParentsAny(JsonNode root, List<String> keys) {
        Set<JsonNode> set = new LinkedHashSet<>();
        for (String k : keys) {
            List<JsonNode> found = root.findParents(k);
            if (found != null)
                set.addAll(found);
        }
        return set;
    }
}

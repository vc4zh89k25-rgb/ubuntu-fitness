/*
 * Ubuntu Fitness & Wellness - order processing server (Java)
 *
 * WHAT IT DOES
 *   Listens for the order that checkout.js sends, checks it, works out the
 *   total from its OWN price list, "authorises" the payment, saves the order
 *   to orders.txt and replies with an order number as JSON.
 *
 * HOW TO RUN (needs a JDK, version 11 or newer, no other downloads):
 *   cd backend/java
 *   java OrderServer.java
 *
 * Then open js/checkout.js and set:
 *   var ORDER_API_URL = "http://localhost:8080/api/orders";
 */

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;

public class OrderServer {

    static final int PORT = 8080;
    static final double DELIVERY_FEE = 80.0;
    static final double FREE_DELIVERY_OVER = 750.0;
    static final double VAT_RATE = 0.15;
    static final int MAX_QTY = 10;
    static final String SERVER_NAME = "Java server";

    // The server's own price list. Keep it the same as js/products.js.
    static final Map<Integer, Double> PRICES = new HashMap<>();
    // Ids of services (coaching and plans). Services are never delivered.
    static final Set<Integer> SERVICES = new HashSet<>();

    static {
        PRICES.put(1, 349.0);   PRICES.put(2, 229.0);   PRICES.put(3, 279.0);
        PRICES.put(4, 199.0);   PRICES.put(5, 119.0);   PRICES.put(6, 649.0);
        PRICES.put(7, 599.0);   PRICES.put(8, 399.0);   PRICES.put(9, 329.0);
        PRICES.put(10, 169.0);  PRICES.put(11, 389.0);  PRICES.put(12, 279.0);
        PRICES.put(13, 299.0);  PRICES.put(14, 249.0);  PRICES.put(15, 1499.0);
        PRICES.put(16, 299.0);  PRICES.put(17, 129.0);  PRICES.put(18, 1899.0);
        PRICES.put(19, 399.0);  PRICES.put(20, 219.0);  PRICES.put(21, 89.0);
        PRICES.put(22, 799.0);  PRICES.put(23, 229.0);  PRICES.put(24, 250.0);
        PRICES.put(25, 1600.0); PRICES.put(26, 199.0);  PRICES.put(27, 149.0);

        SERVICES.add(24);
        SERVICES.add(25);
        SERVICES.add(26);
        SERVICES.add(27);
    }

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/orders", OrderServer::handleOrder);
        server.createContext("/", exchange -> {
            byte[] hello = "Ubuntu Fitness order server is running. POST orders to /api/orders."
                    .getBytes(StandardCharsets.UTF_8);
            addCorsHeaders(exchange);
            exchange.sendResponseHeaders(200, hello.length);
            try (OutputStream out = exchange.getResponseBody()) { out.write(hello); }
        });
        server.start();
        System.out.println("Ubuntu Fitness order server running on http://localhost:" + PORT + "/api/orders");
        System.out.println("Press Ctrl+C to stop.");
    }

    /* ---------- request handling ---------- */

    static void handleOrder(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        String method = exchange.getRequestMethod();

        if ("OPTIONS".equals(method)) {              // browser "pre-flight" check
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }
        if (!"POST".equals(method)) {
            sendJson(exchange, 405, failJson("Send orders with POST."));
            return;
        }

        try {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            Map<String, String> form = parseForm(body);

            // 1. Read and check the items
            Map<Integer, Integer> items = parseItems(form.get("items"));
            if (items == null) {
                sendJson(exchange, 400, failJson("The order has no valid items."));
                return;
            }

            // 2. Check customer details
            String name = clean(form.get("name"));
            String email = clean(form.get("email"));
            String phone = clean(form.get("phone"));
            if (name.length() < 2 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || phone.length() < 9) {
                sendJson(exchange, 400, failJson("Your name, email or phone number is missing or invalid."));
                return;
            }

            // 3. Work out the totals from OUR prices (never trust prices from the browser)
            double goods = 0;
            double services = 0;
            for (Map.Entry<Integer, Integer> line : items.entrySet()) {
                double lineTotal = PRICES.get(line.getKey()) * line.getValue();
                if (SERVICES.contains(line.getKey())) { services += lineTotal; } else { goods += lineTotal; }
            }
            boolean hasGoods = goods > 0;

            String delivery = clean(form.get("delivery"));
            if (!hasGoods) {
                delivery = "none";
            } else if (!delivery.equals("courier") && !delivery.equals("collect")) {
                sendJson(exchange, 400, failJson("Choose courier delivery or collection."));
                return;
            }
            if (delivery.equals("courier")) {
                if (clean(form.get("street")).length() < 3
                        || clean(form.get("city")).length() < 2
                        || !clean(form.get("postal")).matches("^[0-9]{4}$")) {
                    sendJson(exchange, 400, failJson("The delivery address is incomplete."));
                    return;
                }
            }
            double deliveryFee = (delivery.equals("courier") && goods < FREE_DELIVERY_OVER) ? DELIVERY_FEE : 0.0;
            double total = goods + services + deliveryFee;

            // 4. Authorise the payment (simulated)
            String cardLast4 = clean(form.get("cardLast4"));
            if (!cardLast4.matches("^[0-9]{4}$")) {
                sendJson(exchange, 400, failJson("The card details are missing."));
                return;
            }
            if (!authorisePayment(cardLast4, total)) {
                sendJson(exchange, 402, failJson("Your card was declined. Try a different card."));
                return;
            }

            // 5. Save the order and reply
            String orderNumber = makeOrderNumber();
            saveOrder(orderNumber, name, email, delivery, items, total);
            System.out.printf(Locale.US, "Order %s approved for %s, total R%.2f%n", orderNumber, name, total);

            String json = "{\"success\":true"
                    + ",\"orderNumber\":\"" + orderNumber + "\""
                    + ",\"total\":" + String.format(Locale.US, "%.2f", total)
                    + ",\"message\":\"Payment approved.\""
                    + ",\"processedBy\":\"" + SERVER_NAME + "\"}";
            sendJson(exchange, 200, json);

        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 500, failJson("Something went wrong on the server. Please try again."));
        }
    }

    /* ---------- payment ---------- */

    // A real shop would call a payment gateway here (PayFast, Peach Payments, Stripe...).
    // For the project we simulate it: any card is approved, except one ending in 0002.
    static boolean authorisePayment(String cardLast4, double amount) {
        return !cardLast4.equals("0002");
    }

    /* ---------- helpers ---------- */

    // "6:2,24:1" -> {6=2, 24=1}. Returns null if anything is wrong.
    static Map<Integer, Integer> parseItems(String text) {
        if (text == null || text.trim().isEmpty()) { return null; }
        Map<Integer, Integer> items = new LinkedHashMap<>();
        for (String part : text.split(",")) {
            String[] pieces = part.split(":");
            if (pieces.length != 2) { return null; }
            try {
                int id = Integer.parseInt(pieces[0].trim());
                int qty = Integer.parseInt(pieces[1].trim());
                if (!PRICES.containsKey(id) || qty < 1 || qty > MAX_QTY) { return null; }
                items.merge(id, qty, Integer::sum);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        for (int qty : items.values()) { if (qty > MAX_QTY) { return null; } }
        return items.isEmpty() ? null : items;
    }

    static Map<String, String> parseForm(String body) {
        Map<String, String> map = new HashMap<>();
        for (String pair : body.split("&")) {
            if (pair.isEmpty()) { continue; }
            int eq = pair.indexOf('=');
            String key = eq < 0 ? pair : pair.substring(0, eq);
            String value = eq < 0 ? "" : pair.substring(eq + 1);
            map.put(URLDecoder.decode(key, StandardCharsets.UTF_8), URLDecoder.decode(value, StandardCharsets.UTF_8));
        }
        return map;
    }

    static String clean(String value) {
        return value == null ? "" : value.replaceAll("[\\r\\n|]", " ").trim();
    }

    static String makeOrderNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "UF-" + date + "-" + (1000 + new Random().nextInt(9000));
    }

    static synchronized void saveOrder(String orderNumber, String name, String email, String delivery,
                                       Map<Integer, Integer> items, double total) throws IOException {
        String line = LocalDateTime.now() + " | " + orderNumber + " | " + name + " | " + email + " | "
                + delivery + " | items " + items + " | R" + String.format(Locale.US, "%.2f", total)
                + System.lineSeparator();
        Files.write(Paths.get("orders.txt"), line.getBytes(StandardCharsets.UTF_8),
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }

    static String failJson(String message) {
        return "{\"success\":false,\"message\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"")
                + "\",\"processedBy\":\"" + SERVER_NAME + "\"}";
    }

    static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) { out.write(bytes); }
    }
}

// Ubuntu Fitness & Wellness - order processing server (C#, ASP.NET Core)
//
// WHAT IT DOES
//   Listens for the order that checkout.js sends, checks it, works out the
//   total from its OWN price list, "authorises" the payment, saves the order
//   to orders.txt and replies with an order number as JSON.
//   It does the same job as backend/java/OrderServer.java, so use whichever
//   language your lecturer or group prefers.
//
// HOW TO RUN (needs the .NET 8 SDK from https://dotnet.microsoft.com/download):
//   cd backend/csharp
//   dotnet run
//
// Then open js/checkout.js and set:
//   var ORDER_API_URL = "http://localhost:5000/api/orders";

using System.Globalization;
using System.Text.RegularExpressions;

const string ServerName = "C# server";
const decimal DeliveryFee = 80m;
const decimal FreeDeliveryOver = 750m;
const int MaxQty = 10;

// The server's own price list. Keep it the same as js/products.js.
var prices = new Dictionary<int, decimal>
{
    [1] = 349m,   [2] = 229m,   [3] = 279m,   [4] = 199m,   [5] = 119m,
    [6] = 649m,   [7] = 599m,   [8] = 399m,   [9] = 329m,   [10] = 169m,
    [11] = 389m,  [12] = 279m,  [13] = 299m,  [14] = 249m,  [15] = 1499m,
    [16] = 299m,  [17] = 129m,  [18] = 1899m, [19] = 399m,  [20] = 219m,
    [21] = 89m,   [22] = 799m,  [23] = 229m,  [24] = 250m,  [25] = 1600m,
    [26] = 199m,  [27] = 149m
};

// Ids of services (coaching and plans). Services are never delivered.
var services = new HashSet<int> { 24, 25, 26, 27 };

var fileLock = new object();

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

app.MapGet("/", () => "Ubuntu Fitness order server is running. POST orders to /api/orders.");

app.MapPost("/api/orders", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
    {
        return Fail("Send the order as form data.", 400);
    }
    var form = await request.ReadFormAsync();

    // Reads one form field, removing line breaks and the | character.
    string Field(string key) => Regex.Replace(form[key].ToString(), @"[\r\n|]", " ").Trim();

    // 1. Read and check the items
    var items = ParseItems(Field("items"));
    if (items == null)
    {
        return Fail("The order has no valid items.", 400);
    }

    // 2. Check customer details
    string name = Field("name");
    string email = Field("email");
    string phone = Field("phone");
    if (name.Length < 2 || !Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$") || phone.Length < 9)
    {
        return Fail("Your name, email or phone number is missing or invalid.", 400);
    }

    // 3. Work out the totals from OUR prices (never trust prices from the browser)
    decimal goods = 0;
    decimal serviceTotal = 0;
    foreach (var line in items)
    {
        decimal lineTotal = prices[line.Key] * line.Value;
        if (services.Contains(line.Key)) { serviceTotal += lineTotal; } else { goods += lineTotal; }
    }
    bool hasGoods = goods > 0;

    string delivery = Field("delivery");
    if (!hasGoods)
    {
        delivery = "none";
    }
    else if (delivery != "courier" && delivery != "collect")
    {
        return Fail("Choose courier delivery or collection.", 400);
    }
    if (delivery == "courier")
    {
        if (Field("street").Length < 3 || Field("city").Length < 2 || !Regex.IsMatch(Field("postal"), @"^[0-9]{4}$"))
        {
            return Fail("The delivery address is incomplete.", 400);
        }
    }
    decimal deliveryFee = (delivery == "courier" && goods < FreeDeliveryOver) ? DeliveryFee : 0m;
    decimal total = goods + serviceTotal + deliveryFee;

    // 4. Authorise the payment (simulated)
    string cardLast4 = Field("cardLast4");
    if (!Regex.IsMatch(cardLast4, @"^[0-9]{4}$"))
    {
        return Fail("The card details are missing.", 400);
    }
    if (!AuthorisePayment(cardLast4, total))
    {
        return Fail("Your card was declined. Try a different card.", 402);
    }

    // 5. Save the order and reply
    string orderNumber = MakeOrderNumber();
    SaveOrder(orderNumber, name, email, delivery, items, total);
    Console.WriteLine($"Order {orderNumber} approved for {name}, total R{total.ToString("F2", CultureInfo.InvariantCulture)}");

    return Results.Json(new
    {
        success = true,
        orderNumber,
        total,
        message = "Payment approved.",
        processedBy = ServerName
    });
});

app.Run("http://localhost:5000");

/* ---------- helpers (local functions) ---------- */

IResult Fail(string message, int status) =>
    Results.Json(new { success = false, message, processedBy = ServerName }, statusCode: status);

// A real shop would call a payment gateway here (PayFast, Peach Payments, Stripe...).
// For the project we simulate it: any card is approved, except one ending in 0002.
bool AuthorisePayment(string cardLast4, decimal amount) => cardLast4 != "0002";

// "6:2,24:1" -> { 6: 2, 24: 1 }. Returns null if anything is wrong.
Dictionary<int, int>? ParseItems(string text)
{
    if (string.IsNullOrWhiteSpace(text)) { return null; }
    var result = new Dictionary<int, int>();
    foreach (var part in text.Split(','))
    {
        var pieces = part.Split(':');
        if (pieces.Length != 2) { return null; }
        if (!int.TryParse(pieces[0].Trim(), out int id) || !int.TryParse(pieces[1].Trim(), out int qty)) { return null; }
        if (!prices.ContainsKey(id) || qty < 1 || qty > MaxQty) { return null; }
        result[id] = result.GetValueOrDefault(id) + qty;
    }
    foreach (var qty in result.Values) { if (qty > MaxQty) { return null; } }
    return result.Count == 0 ? null : result;
}

string MakeOrderNumber() =>
    "UF-" + DateTime.Now.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "-" + Random.Shared.Next(1000, 10000);

void SaveOrder(string orderNumber, string name, string email, string delivery, Dictionary<int, int> items, decimal total)
{
    string itemText = string.Join(",", items.Select(i => $"{i.Key}:{i.Value}"));
    string line = $"{DateTime.Now:s} | {orderNumber} | {name} | {email} | {delivery} | items {itemText} | R{total.ToString("F2", CultureInfo.InvariantCulture)}";
    lock (fileLock)
    {
        File.AppendAllText("orders.txt", line + Environment.NewLine);
    }
}

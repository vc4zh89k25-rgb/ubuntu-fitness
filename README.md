

This is the starter website for Phase Three, Task 1: a product catalogue, shopping cart and transaction processing, built with XHTML, CSS, JavaScript, Java and C#.



```
index.html          Home page
products.html       Product catalogue (filter, search, sort)
services.html       Coaching and plans
cart.html           Shopping cart
checkout.html       Checkout form and payment
confirmation.html   Order receipt
css/style.css       One stylesheet for the whole site
js/products.js      The product list (edit this to change the catalogue)
js/cart.js          Cart logic: add, remove, totals, delivery fee, VAT
js/shop.js          Draws the catalogue cards
js/cartpage.js      Draws the cart page
js/checkout.js      Validation and sending the order
js/confirmation.js  Draws the receipt
images/             Put your product photos here
backend/java/       Order server in Java
backend/csharp/     Order server in C#
```



| Brief requirement | Where it is |
| --- | --- |
| Product catalogue display | `products.html` + `js/shop.js` + `js/products.js` |
| Shopping cart capabilities | `cart.html` + `js/cart.js` + `js/cartpage.js` |
| Transaction processing | `checkout.html` + `js/checkout.js` + the Java or C# server |
| XHTML | every `.html` file (XHTML 1.0 Strict) |
| CSS | `css/style.css` |
| JavaScript | everything in `js/` |
| Java and C# | `backend/java/OrderServer.java` and `backend/csharp/Program.cs` |



The site works on its own in "demo mode". The easiest way:

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Double-clicking `index.html` also works in most browsers.




| Card number | Result |
| --- | --- |
| 4111 1111 1111 1111 | Approved |
| 4000 0000 0000 0002 | Declined |

Use any expiry date in the future (for example 12/28) and any 3-digit security code.


Pick one (or show both). They do the same job: check the order, calculate the total from their own price list, approve or decline the payment, save the order to `orders.txt` and reply with an order number.

**Java** (needs a JDK, version 11 or newer):

```
cd backend/java
java OrderServer.java
```

**C#** (needs the .NET 8 SDK):

```
cd backend/csharp
dotnet run
```

Then open `js/checkout.js` and change the first line to match the server you started:

```js
var ORDER_API_URL = "http://localhost:8080/api/orders";   // Java
var ORDER_API_URL = "http://localhost:5000/api/orders";   // C#
var ORDER_API_URL = "";                                   // demo mode, no server
```

The receipt page shows which server processed the order.

1. **Products and prices:** edit `js/products.js`. If you change a price or add a product, make the same change in the price list at the top of `OrderServer.java` and `Program.cs`. The servers never trust prices sent by the browser.
2. **Photos:** put images in `images/` and add `image: "images/whey.jpg"` to a product in `products.js`. Without it, the card shows an emoji icon.
3. **Store details:** search the pages for `[Mmabatho unit 1, Mahikeng, North West, South Africa]`, `061 896 8906` and `ubuntufitness.mahikeng@gmail.com` and replace them with your real details.
4. **Delivery rules and VAT:** the top of `js/cart.js` (and the constants in the Java and C# files).
5. **Colours and fonts:** the `:root` block at the top of `css/style.css`.



* **Card details:** the full card number is never sent or stored. Only the last four digits go to the server. A real shop would use a payment gateway such as PayFast, Peach Payments or Stripe.
* **Orders** are saved to a plain text file (`orders.txt`) by the servers. For INFS 222 you can replace that with a MySQL table.
* **Validate your XHTML** at https://validator.w3.org (use "Validate by File Upload"). Keep tags lowercase, close every tag, and quote every attribute.
* **The cart** is kept in the browser's `localStorage`, so it survives page changes and refreshes. It is not shared between devices or browsers.

# Stripe Payment Gateway Integration Guide

This guide provides step-by-step instructions for integrating Stripe payment gateway into a new project.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. Express.js backend setup
4. React frontend (optional, for client-side integration)

---

## Step 1: Install Stripe Package

### Backend (Node.js/Express)

```bash
cd server
npm install stripe
```

Or if using yarn:

```bash
cd server
yarn add stripe
```

### Frontend (React - Optional, for Stripe Elements)

```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## Step 2: Get Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Go to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` for test mode)
   - **Secret key** (starts with `sk_test_` for test mode)
4. For webhooks, you'll also need a **Webhook Secret** (we'll cover this later)

---

## Step 3: Set Up Environment Variables

Create a `.env` file in your server directory:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Important:** Never commit your `.env` file to version control. Add it to `.gitignore`.

---

## Step 4: Backend Setup

### 4.1 Create Stripe Configuration File

Create `server/config/stripe.js`:

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

### 4.2 Create Payment Controller

Create `server/controllers/paymentController.js`:

```javascript
const stripe = require("../config/stripe");
// Import your models (Cart, Order, etc.)

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { shippingAddress, billingAddress } = req.body;

    // Validate addresses
    if (!shippingAddress || !billingAddress) {
      return res.status(400).json({
        error: "Shipping and billing addresses are required",
      });
    }

    // Get cart items (adjust based on your cart model)
    // const cartItems = await getCartItems(userId);

    // Calculate total amount (in dollars)
    const totalAmount = 100; // Replace with actual calculation
    // Example: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "usd", // Change to your currency
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Order for user ${userId}`,
      metadata: {
        userId: userId.toString(),
        // Add any additional metadata you need
      },
      shipping: {
        name: shippingAddress.name || "Customer",
        address: {
          line1: shippingAddress.addressLine1 || "",
          line2: shippingAddress.addressLine2 || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          postal_code: shippingAddress.zipCode || "",
          country: shippingAddress.country || "US",
        },
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount: totalAmount,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "Payment intent ID is required",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check payment status
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Payment not completed",
        status: paymentIntent.status,
      });
    }

    // Create order in your database
    // const order = await createOrder({
    //   user_id: userId,
    //   stripe_payment_intent_id: paymentIntentId,
    //   total_amount: paymentIntent.amount / 100,
    //   status: 'paid'
    // });

    res.json({
      message: "Payment confirmed successfully",
      orderId: "order_id_here", // Replace with actual order ID
      transactionId: paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      error: "Failed to confirm payment",
    });
  }
};

// Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({
      error: "Failed to get payment status",
    });
  }
};

// Webhook Handler (for production)
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Payment succeeded:", paymentIntent.id);
      // Update your order status in database
      break;
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleWebhook,
};
```

### 4.3 Create Payment Routes

Create `server/routes/payment.js`:

```javascript
const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  handleWebhook,
} = require("../controllers/paymentController");

// Create payment intent
router.post("/:userId/create-intent", createPaymentIntent);

// Confirm payment
router.post("/:userId/confirm", confirmPayment);

// Get payment status
router.get("/payment-intent/:paymentIntentId/status", getPaymentStatus);

// Webhook endpoint (must use raw body parser)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

module.exports = router;
```

### 4.4 Register Routes in Server

In your `server.js` or `app.js`:

```javascript
const express = require("express");
const app = express();

// ... other middleware ...

// Register payment routes
app.use("/api/payment", require("./routes/payment"));

// ... rest of your server setup ...
```

---

## Step 5: Frontend Integration (React)

### 5.1 Basic Integration (Without Stripe Elements)

If you're not using Stripe Elements, you can make direct API calls:

```javascript
// In your checkout component
const handleCheckout = async () => {
  try {
    // Step 1: Create payment intent
    const response = await fetch(`/api/payment/${userId}/create-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shippingAddress: billingInfo,
        billingAddress: billingInfo,
      }),
    });

    const { clientSecret, paymentIntentId } = await response.json();

    // Step 2: Confirm payment (in production, use Stripe Elements)
    const confirmResponse = await fetch(`/api/payment/${userId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentIntentId: paymentIntentId,
      }),
    });

    const result = await confirmResponse.json();
    console.log("Payment successful:", result);
  } catch (error) {
    console.error("Payment failed:", error);
  }
};
```

### 5.2 Advanced Integration (With Stripe Elements - Recommended)

Install Stripe React packages:

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Wrap your app with Stripe provider:

```javascript
// In your main App.js or index.js
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_your_publishable_key_here");

function App() {
  return (
    <Elements stripe={stripePromise}>{/* Your app components */}</Elements>
  );
}
```

Create a checkout form component:

```javascript
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

function CheckoutForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Customer Name",
          },
        },
      }
    );

    if (error) {
      console.error("Payment failed:", error);
    } else if (paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
}
```

---

## Step 6: API Endpoints Summary

### Backend Endpoints

1. **Create Payment Intent**

   - `POST /api/payment/:userId/create-intent`
   - Body: `{ shippingAddress, billingAddress }`
   - Returns: `{ clientSecret, paymentIntentId, totalAmount }`

2. **Confirm Payment**

   - `POST /api/payment/:userId/confirm`
   - Body: `{ paymentIntentId }`
   - Returns: `{ message, orderId, transactionId, amount, currency }`

3. **Get Payment Status**

   - `GET /api/payment/payment-intent/:paymentIntentId/status`
   - Returns: `{ status, amount, currency }`

4. **Webhook Endpoint**
   - `POST /api/payment/webhook`
   - Handles Stripe webhook events

---

## Step 7: Testing

### Test Card Numbers (Stripe Test Mode)

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### Test the Integration

1. Start your server:

   ```bash
   npm start
   ```

2. Make a test payment using the test card numbers above.

3. Check your Stripe Dashboard → **Payments** to see the test transactions.

---

## Step 8: Webhook Setup (Production)

1. Install Stripe CLI:

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:

   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:

   ```bash
   stripe listen --forward-to localhost:3001/api/payment/webhook
   ```

4. Copy the webhook signing secret and add it to your `.env`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. For production, create a webhook endpoint in Stripe Dashboard:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Enter your production URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret to your production `.env`

---

## Step 9: Production Checklist

- [ ] Switch to live API keys (replace `sk_test_` with `sk_live_`)
- [ ] Update publishable key in frontend
- [ ] Set up webhook endpoint in Stripe Dashboard
- [ ] Test with real card (use small amount first)
- [ ] Implement proper error handling
- [ ] Add logging for payment events
- [ ] Set up SSL certificate (HTTPS required for production)
- [ ] Review Stripe security best practices

---

## Common Issues & Solutions

### Issue: "No such payment_intent"

- **Solution:** Make sure you're using the correct payment intent ID and it exists in your Stripe account.

### Issue: Webhook signature verification fails

- **Solution:** Ensure you're using `express.raw()` middleware for the webhook route and the correct webhook secret.

### Issue: Payment amount mismatch

- **Solution:** Remember Stripe amounts are in cents. Multiply dollars by 100.

### Issue: CORS errors

- **Solution:** Make sure CORS is enabled in your Express server and includes your frontend domain.

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)

---

## Quick Command Reference

```bash
# Install Stripe
npm install stripe

# Install Stripe React (frontend)
npm install @stripe/stripe-js @stripe/react-stripe-js

# Test webhook locally
stripe listen --forward-to localhost:3001/api/payment/webhook

# Test payment intent creation
curl -X POST http://localhost:3001/api/payment/123/create-intent \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress": {...}, "billingAddress": {...}}'
```

---

**Note:** This guide provides a basic integration. For production use, implement proper error handling, logging, and security measures according to Stripe's best practices.

import React, { useState, useEffect } from "react";
import api from "../utils/api";

function Renew() {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => setCompany(res.data.company));
  }, []);

  const handleRenew = async (amount, planName) => {
    const { data } = await api.post("/renewal/create-order", {
      amount,
      planName,
    });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: data.order.id,
      amount: data.order.amount,
      currency: "INR",
      name: "Nandi Billing Renewal",
      handler: async function (response) {
        const verify = await api.post("/renewal/verify", {
          ...response,
          companyId: company._id,
          amount,
          planName,
        });

        if (verify.data.success) {
          alert("Renewal successful!");
          window.location.href = "/dashboard";
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (!company) return <p>Loading...</p>;

  return (
    <div className="container mt-5 text-center">
      <h2>Your Subscription Has Expired</h2>
      <p>Please renew to continue using the billing software.</p>

      <button
        onClick={() => handleRenew(999, "Starter")}
        className="btn btn-primary mt-3"
      >
        Renew Starter — ₹999/year
      </button>
    </div>
  );
}

export default Renew;

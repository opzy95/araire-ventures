import React, { useState } from 'react';
import { FiCheckCircle, FiCopy, FiUpload, FiX } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, authEndpoints } from '../services/api';
import './OrderCheckout.css';

function formatPrice(value) {
  const amount = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return `₦${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-NG')}`;
}

function OrderCheckout({ onClose }) {
  const { token, user } = useAuth();
  const { items, getTotalPrice, refreshCart } = useCart();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [cartRefreshError, setCartRefreshError] = useState('');

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!items.length) {
      setError('Your cart is empty. Add products before placing an order.');
      return;
    }
    if (!token) {
      setError('Please sign in again before placing your order.');
      return;
    }
    if (paymentMethod === 'bank-transfer' && !transferConfirmed) {
      setError('Review the bank details and confirm that you have made the transfer before placing the order.');
      setIsTransferModalOpen(true);
      return;
    }
    if (receipt && !receipt.type.startsWith('image/')) {
      setError('Please choose an image file for the payment receipt.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber.trim());
    formData.append('deliveryAddress', deliveryAddress.trim());
    if (receipt) formData.append('receipt', receipt);

    try {
      const payload = await apiRequest(authEndpoints.orders, {
        method: 'POST',
        token,
        body: formData,
      });
      const result = payload?.data ?? payload ?? {};
      const order = result.order ?? result;
      setCreatedOrder(order);

      try {
        await refreshCart();
      } catch (refreshError) {
        setCartRefreshError(`The order was placed, but the cart could not be refreshed: ${refreshError.message}`);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-checkout-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section
        className="order-checkout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-checkout-title"
      >
        <button
          className="order-checkout-close"
          type="button"
          aria-label="Close checkout"
          onClick={onClose}
          disabled={isSubmitting}
        >
          <FiX />
        </button>

        {createdOrder ? (
          <div className="order-checkout-success">
            <FiCheckCircle />
            <p className="order-checkout-eyebrow">ORDER RECEIVED</p>
            <h2 id="order-checkout-title">Thank you for your order.</h2>
            <p>Payment status: <strong>{createdOrder.paymentStatus || 'pending'}</strong>. Only an admin can confirm payment.</p>
            {createdOrder.status && (
              <p className="order-checkout-reference">Order status: {createdOrder.status}</p>
            )}
            {createdOrder.id || createdOrder._id ? (
              <p className="order-checkout-reference">
                Order reference: {createdOrder.id || createdOrder._id}
              </p>
            ) : null}
            {createdOrder.total !== undefined && (
              <p className="order-checkout-reference">Order total: {formatPrice(createdOrder.total)}</p>
            )}
            {cartRefreshError && <p className="order-checkout-error" role="alert">{cartRefreshError}</p>}
            <button className="order-checkout-submit" type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="order-checkout-eyebrow">SECURE CHECKOUT</p>
            <h2 id="order-checkout-title">Delivery and payment</h2>
            <p className="order-checkout-intro">
              Your order total is {formatPrice(getTotalPrice())}. Enter delivery details and choose how you’ll pay.
            </p>

            {error && <p className="order-checkout-error" role="alert">{error}</p>}

            <form className="order-checkout-form" onSubmit={submitOrder}>
              <label>
                Phone number
                <input
                  type="tel"
                  name="phoneNumber"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  required
                />
              </label>
              <label>
                Delivery address
                <textarea
                  name="deliveryAddress"
                  autoComplete="street-address"
                  rows="3"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  required
                />
              </label>

              <fieldset className="order-payment-options">
                <legend>Payment method</legend>
                <label className={`order-payment-choice${paymentMethod === 'bank-transfer' ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank-transfer"
                    checked={paymentMethod === 'bank-transfer'}
                    onChange={() => {
                      setPaymentMethod('bank-transfer');
                      setTransferConfirmed(false);
                      setIsTransferModalOpen(true);
                    }}
                  />
                  <span><strong>Direct bank transfer</strong><small>Pay by bank transfer</small></span>
                </label>
                <label className={`order-payment-choice${paymentMethod === 'cash' ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => {
                      setPaymentMethod('cash');
                      setTransferConfirmed(false);
                      setIsTransferModalOpen(false);
                      setReceipt(null);
                    }}
                  />
                  <span><strong>Cash payment</strong><small>Arrange cash payment with the store</small></span>
                </label>
              </fieldset>

              {paymentMethod === 'bank-transfer' ? (
                <div className="order-transfer-action">
                  {transferConfirmed ? (
                    <p className="order-transfer-confirmed">Transfer marked as made. Your order will still be pending admin verification.</p>
                  ) : (
                    <p className="order-payment-reminder">Review the account details and make your transfer before placing the order.</p>
                  )}
                  <button className="order-view-bank-details" type="button" onClick={() => setIsTransferModalOpen(true)}>
                    {transferConfirmed ? 'View transfer details' : 'View bank transfer details'}
                  </button>
                  {receipt && <p className="order-receipt-selected"><FiUpload /> Receipt selected: {receipt.name}</p>}
                </div>
              ) : (
                <p className="order-payment-reminder order-cash-reminder">
                  Your order will remain pending until payment is received and confirmed by an admin.
                </p>
              )}

              <div className="order-checkout-total">
                <span>Total amount of goods</span>
                <strong>{formatPrice(getTotalPrice())}</strong>
              </div>
              <button className="order-checkout-submit" type="submit" disabled={isSubmitting || !items.length}>
                {isSubmitting ? 'Placing order…' : 'Place order'}
              </button>
            </form>
          </>
        )}
      </section>
      {isTransferModalOpen && (
        <div
          className="order-transfer-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsTransferModalOpen(false);
          }}
        >
          <section
            className="order-transfer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-transfer-title"
          >
            <button
              className="order-checkout-close"
              type="button"
              aria-label="Close bank transfer details"
              onClick={() => setIsTransferModalOpen(false)}
            >
              <FiX />
            </button>
            <p className="order-checkout-eyebrow">DIRECT BANK TRANSFER</p>
            <h2 id="order-transfer-title">Make your payment</h2>
            <p className="order-transfer-instructions">Transfer the exact amount below, then optionally attach your receipt.</p>
            <div className="order-transfer-account">
              <div>
                <span>Bank</span>
                <strong>OPay</strong>
              </div>
              <div>
                <span>Account name</span>
                <strong>Adeoti Aminat</strong>
              </div>
              <div>
                <span>Account number</span>
                <strong className="order-account-number">7035532047</strong>
                <button
                  type="button"
                  className="order-copy-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText('7035532047');
                      setCopyMessage('Account number copied.');
                    } catch {
                      setCopyMessage('Copy is unavailable here. You can select and copy the account number.');
                    }
                  }}
                >
                  <FiCopy /> Copy
                </button>
              </div>
              <div className="order-transfer-amount">
                <span>Amount to transfer</span>
                <strong>{formatPrice(getTotalPrice())}</strong>
              </div>
            </div>
            {copyMessage && <p className="order-copy-message" role="status">{copyMessage}</p>}
            <label className="order-receipt-upload">
              <FiUpload />
              <span>{receipt ? receipt.name : 'Upload receipt image (optional)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setReceipt(file);
                  if (file && !file.type.startsWith('image/')) {
                    setError('Please choose an image file for the payment receipt.');
                  } else {
                    setError('');
                  }
                }}
              />
            </label>
            <p className="order-payment-reminder">
              Telling us you transferred does not mark the order as paid. It will remain pending until an admin verifies the payment.
            </p>
            <button
              className="order-checkout-submit order-transfer-confirm"
              type="button"
              onClick={() => {
                setTransferConfirmed(true);
                setIsTransferModalOpen(false);
                setCopyMessage('');
              }}
            >
              I’ve made the transfer
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default OrderCheckout;

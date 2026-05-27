import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useRequestOtp, useVerifyOtp, useCreateOrder, useCreatePaymentIntent } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Lock, Mail, CheckCircle2 } from 'lucide-react';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  shippingAddress: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

type Step = 'details' | 'otp' | 'payment';

function OrderSummary({ cartTotal }: { cartTotal: number }) {
  const { cart } = useCart();
  return (
    <div className="bg-card border rounded-2xl p-6 sticky top-24">
      <h3 className="font-bold font-display uppercase tracking-wider mb-6 pb-4 border-b">Order Summary</h3>
      <div className="space-y-4 mb-6">
        {cart.map(item => (
          <div key={`${item.jerseyId}-${item.size}`} className="flex justify-between items-start text-sm">
            <div className="flex-1 pr-4">
              <span className="font-bold">{item.quantity}x</span> {item.jerseyName}
              <p className="text-muted-foreground text-xs mt-1">Size: {item.size} · {item.teamName}</p>
            </div>
            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-500 font-semibold">Free</span>
        </div>
        <div className="flex justify-between font-black font-display text-xl mt-4 pt-4 border-t">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" /> SSL Encrypted · Powered by Stripe
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'Shipping' },
    { id: 'otp', label: 'Verify' },
    { id: 'payment', label: 'Payment' },
  ];
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${i <= idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {i < idx ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 flex items-center justify-center">{i + 1}</span>}
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 transition-all ${i < idx ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  isCreatingOrder: boolean;
}

function StripePaymentForm({ clientSecret, onSuccess, isCreatingOrder }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/order-confirmation' },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setIsProcessing(false);
      toast({ title: 'Payment failed', description: stripeError.message, variant: 'destructive' });
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="text-destructive text-sm font-medium">{error}</p>
      )}
      <Button
        onClick={handlePayment}
        disabled={!stripe || isProcessing || isCreatingOrder}
        className="w-full h-14 text-lg font-bold uppercase tracking-widest"
        data-testid="button-pay"
      >
        {isProcessing || isCreatingOrder ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, cartTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('details');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      shippingAddress: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });

  useEffect(() => {
    if (cart.length === 0 && step === 'details') {
      setLocation('/cart');
    }
  }, [cart.length, step, setLocation]);

  if (cart.length === 0 && step === 'details') return null;

  const onRequestOtp = async (data: CheckoutFormData) => {
    try {
      const result = await requestOtpMutation.mutateAsync({ data: { email: data.customerEmail } });
      setDevOtp(result.devOtp || null);
      setStep('otp');
      toast({ title: 'Code sent', description: `Check ${data.customerEmail} for your 6-digit code.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send code. Please try again.', variant: 'destructive' });
    }
  };

  const onVerifyOtp = async () => {
    if (otpValue.length !== 6) return;
    try {
      const result = await verifyOtpMutation.mutateAsync({
        data: { email: form.getValues('customerEmail'), otp: otpValue },
      });
      setOtpToken(result.token);

      const amountCents = Math.round(cartTotal * 100);
      const intentResult = await createPaymentIntentMutation.mutateAsync({
        data: { amountCents, currency: 'usd' },
      });
      setClientSecret(intentResult.clientSecret);
      setStep('payment');
    } catch {
      toast({ title: 'Verification failed', description: 'Invalid or expired code.', variant: 'destructive' });
      setOtpValue('');
    }
  };

  const onPaymentSuccess = async () => {
    try {
      const formData = form.getValues();
      await createOrderMutation.mutateAsync({
        data: {
          items: cart.map(item => ({ jerseyId: item.jerseyId, quantity: item.quantity, size: item.size })),
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          shippingAddress: formData.shippingAddress,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          otpToken: otpToken!,
        },
      });
      clearCart();
      setLocation('/order-confirmation');
    } catch {
      toast({ title: 'Order error', description: 'Payment went through but order failed. Contact support.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter">Secure Checkout</h1>
          <p className="text-muted-foreground mt-2 text-sm">Complete your order to secure your gear.</p>
        </div>

        <StepIndicator current={step} />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">

            {/* Step 1: Shipping Details */}
            <div className={`bg-card border rounded-2xl p-6 md:p-8 shadow-sm transition-opacity duration-300 ${step !== 'details' ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider">Shipping Details</h2>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onRequestOtp)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider">Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} className="h-12" data-testid="input-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider">Email Address</FormLabel>
                        <FormControl><Input placeholder="john@example.com" type="email" {...field} className="h-12" data-testid="input-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold uppercase text-xs tracking-wider">Street Address</FormLabel>
                      <FormControl><Input placeholder="123 Stadium Way" {...field} className="h-12" data-testid="input-address" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider">City</FormLabel>
                        <FormControl><Input placeholder="London" {...field} className="h-12" data-testid="input-city" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider">Postal Code</FormLabel>
                        <FormControl><Input placeholder="SW1A 1AA" {...field} className="h-12" data-testid="input-postal" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold uppercase text-xs tracking-wider">Country</FormLabel>
                        <FormControl><Input placeholder="UK" {...field} className="h-12" data-testid="input-country" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {step === 'details' && (
                    <Button type="submit" className="w-full h-14 text-lg font-bold uppercase tracking-widest mt-4" disabled={requestOtpMutation.isPending} data-testid="button-continue">
                      {requestOtpMutation.isPending ? 'Sending code...' : 'Continue — Send Verification Code'}
                    </Button>
                  )}
                </form>
              </Form>
            </div>

            {/* Step 2: OTP Verification */}
            {(step === 'otp' || step === 'payment') && (
              <div className={`bg-card border-2 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 ${step === 'otp' ? 'border-primary' : 'border-green-500 opacity-40 pointer-events-none'}`}>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'payment' ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                    {step === 'payment' ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                  </div>
                  <h2 className="text-xl font-bold font-display uppercase tracking-wider">Email Verification</h2>
                </div>

                {step === 'otp' && (
                  <div className="text-center">
                    <Mail className="h-10 w-10 text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1 text-sm">
                      A 6-digit code was sent to <strong className="text-foreground">{form.getValues('customerEmail')}</strong>
                    </p>
                    <p className="text-muted-foreground text-xs mb-6">Check your inbox (and spam folder). It expires in 10 minutes.</p>

                    {devOtp && (
                      <div className="bg-amber-500/10 border-2 border-amber-500 rounded-xl p-4 mb-6 inline-block">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Dev Mode — Your code</p>
                        <p className="text-3xl font-black tracking-widest text-amber-400">{devOtp}</p>
                      </div>
                    )}

                    <div className="flex justify-center mb-6">
                      <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} disabled={verifyOtpMutation.isPending || createPaymentIntentMutation.isPending} data-testid="input-otp">
                        <InputOTPGroup className="gap-2">
                          {[0,1,2,3,4,5].map(i => (
                            <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-bold border-2 rounded-lg" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={onVerifyOtp}
                      disabled={otpValue.length !== 6 || verifyOtpMutation.isPending || createPaymentIntentMutation.isPending}
                      className="w-full h-14 text-lg font-bold uppercase tracking-widest"
                      data-testid="button-verify"
                    >
                      {(verifyOtpMutation.isPending || createPaymentIntentMutation.isPending) ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <button onClick={() => { setStep('details'); setOtpValue(''); }} className="mt-4 text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider font-bold transition-colors">
                      Back to Shipping
                    </button>
                  </div>
                )}

                {step === 'payment' && (
                  <p className="text-green-500 font-bold text-center">Identity verified</p>
                )}
              </div>
            )}

            {/* Step 3: Stripe Payment */}
            {step === 'payment' && clientSecret && (
              <div className="bg-card border-2 border-primary rounded-2xl p-6 md:p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <h2 className="text-xl font-bold font-display uppercase tracking-wider">Payment</h2>
                </div>

                {!stripePromise ? (
                  <div className="bg-amber-500/10 border border-amber-500 rounded-lg p-4 text-amber-600 text-sm">
                    <strong>Stripe not configured:</strong> Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your environment secrets and restart the app.
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#c8f500', borderRadius: '8px' } } }}>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      onSuccess={onPaymentSuccess}
                      isCreatingOrder={createOrderMutation.isPending}
                    />
                  </Elements>
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <OrderSummary cartTotal={cartTotal} />
          </div>
        </div>
      </div>
    </div>
  );
}

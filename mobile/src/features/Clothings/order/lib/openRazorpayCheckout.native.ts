import RazorpayCheckout from "react-native-razorpay";

export function openRazorpayCheckout(options: any): Promise<any> {
  return RazorpayCheckout.open(options);
}

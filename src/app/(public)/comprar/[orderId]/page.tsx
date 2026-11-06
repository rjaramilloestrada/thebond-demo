import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Pantallas 2 (datos) y 3 (`?paso=pago`, caja de pagos) del flujo de compra. */
export default async function CheckoutRoute({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { paso } = await searchParams;
  return <CheckoutFlow orderId={orderId} step={paso === "pago" ? "pago" : "datos"} />;
}

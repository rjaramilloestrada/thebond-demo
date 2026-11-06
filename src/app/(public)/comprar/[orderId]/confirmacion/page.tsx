import { ConfirmationView } from "@/components/checkout/ConfirmationView";

type Props = { params: Promise<{ orderId: string }> };

/** Confirmación posterior al pago: tickets con QR único por asistente. */
export default async function ConfirmationRoute({ params }: Props) {
  const { orderId } = await params;
  return <ConfirmationView orderId={orderId} />;
}

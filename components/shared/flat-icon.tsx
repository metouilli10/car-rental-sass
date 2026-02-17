import Image from "next/image";
import { cn } from "@/lib/utils";

export type FlatIconName =
  | "dashboard"
  | "car"
  | "booking"
  | "people"
  | "calendar"
  | "schedule"
  | "payment"
  | "car-insurance"
  | "car-key"
  | "rental-car"
  | "late-payment"
  | "wallet"
  | "duration"
  | "price"
  | "contract"
  | "car-rental"
  | "car-shield"
  | "bill"
  | "cash-flow"
  | "cashless"
  | "rating"
  | "parking"
  | "catalogue"
  | "sortie";

interface FlatIconProps {
  name: FlatIconName;
  size?: number;
  className?: string;
}

export function FlatIcon({ name, size = 20, className }: FlatIconProps) {
  return (
    <Image
      src={`/icons/flaticon/${name}.png`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      draggable={false}
    />
  );
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Szkic" },
  { value: "SENT", label: "Wysłana" },
  { value: "ACCEPTED", label: "Zaakceptowana" },
  { value: "REJECTED", label: "Odrzucona" },
];

export const FINISH_OPTIONS = [
  { value: "MALOWANA_RAL", label: "Malowana RAL" },
  { value: "DREWNOPODOBNA", label: "Drewnopodobna" },
];

export const OKUCIE_OPTIONS = [
  { value: "ALUMINIOWE", label: "Aluminiowe" },
  { value: "PLASTIKOWE", label: "Plastikowe" },
];

export const ORIENTATION_OPTIONS = [
  { value: "POZIOMO", label: "Lamele poziome" },
  { value: "PIONOWO", label: "Lamele pionowe" },
];

export const TYPE_OPTIONS = [
  { value: "STALY", label: "Stały" },
  { value: "JEZDNY", label: "Jezdny (przesuwny)" },
];

export function fmt(n: number) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

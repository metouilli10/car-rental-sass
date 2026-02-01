import { formatCurrencyDH, formatDate, formatDateTime } from "./utils";

export interface ContractData {
  bookingId: string;
  customerName: string;
  passportOrCIN: string;
  phone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  startDate: Date;
  endDate: Date;
  pricePerDay: number;
  numberOfDays: number;
  totalPrice: number;
  depositAmount: number;
  paymentType: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyEmail: string;
  amountPaid: number;
  restToPay: number;
  vehicleKm: number;
  damagePhotos: { photoUrl: string; description?: string | null }[];
  baseUrl?: string;
  agencyPatente?: string;
  agencyIF?: string;
  agencyCNSS?: string;
  agencyRC?: string;
  customerAddress?: string;
  customerDateOfBirth?: string;
  customerLicenseNumber?: string;
  customerLicenseIssueDate?: string;
  customerLicenseExpiry?: string;
  customerNationality?: string;
  pickupLocation?: string;
  returnLocation?: string;
  hasFullInsurance?: boolean;
  franchiseAmount?: string;
}

function splitCustomerName(name: string): { nom: string; prenom: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { nom: "", prenom: "" };
  if (parts.length === 1) return { nom: parts[0], prenom: "" };
  return {
    nom: parts[0],
    prenom: parts.slice(1).join(" "),
  };
}

function getPaymentTypeLabel(type: string): string {
  switch (type) {
    case "CASH":
      return "Espèces";
    case "CARD":
    case "CMI":
      return "Carte bancaire";
    case "TRANSFER":
      return "Virement";
    default:
      return "Espèces";
  }
}

function isPaymentTypeChecked(
  type: string,
  check: "cash" | "cheque" | "card" | "transfer"
): boolean {
  switch (check) {
    case "cash":
      return type === "CASH";
    case "cheque":
      return type === "CHEQUE";
    case "card":
      return type === "CARD" || type === "CMI";
    case "transfer":
      return type === "TRANSFER";
    default:
      return false;
  }
}

const CONDITIONS_GENERALES = `
ARTICLE I : L'état du véhicule - Usage. Réparation
a. Le client déclare avoir visité minutieusement le véhicule et constate son bon état de marche, sa propreté. Le client s'engage a rendre le véhicule bien lavé de l'extérieur et l'intérieure sinon il doit payer les frais du lavage.
b. Le client déclare avoir constaté que les cinq pneus équipant le véhicule sont en bon état, sans coupure et que leur usure est normale. En cas de détérioration de l'un d'entre eux pour une cause Autre que l'usure normale, le client s'engage à le remplacer Immédiatement par un pneu de même dimension et marque du véhicule loué.
c. Le problème mécanique normal est à la charge du loueur, par contre toute réparation provenant soit d'un problème anormal ou de la négligence du client seront à la charge du client. Les dégâts Que le client pourrait causer aux organes mécaniques situés au-dessous du véhicule loué (Carter d'huile, traverses, barres et bras de direction, tuyaux d'échappement, etc.) seront supportés par le client lui-même.
d. Le client ne pourra réclamer au loueur des dommages et Intérêts qu'il s'agisse d'un retard de remise de véhicule, d'annulation ou des réparations dues à un problème anormal survenu en cours de location.
e. La responsabilité du loueur ne pourra être Invoquée même en cas d'accident corporel ou matériel résultant D'un vice, de défauts de fabrication ou de réparations antérieures.
f. Le client s'interdit formellement de quitter le territoire MAROCAIN à bord du véhicule loué sans autorisation écrite du loueur.
g. Le véhicule loué ne peut pas être destiné aux usages suivants :
- Transport de marchandises notamment celles violation des lois et règlements en vigueur (Stupéfiants, Alcool. etc.…)
- Transport de passagers pour des fins à but lucratif.
- Pour le remorquage ou dépannage de tout véhicule.
- Compétitions sportives, rallyes reconnaissances de circuit...
- Les terrains non conformes à la nature et résistance du véhicule loué (Saut pour les véhicules tout terrains) sous peine d'en subir les frais des dégâts constatés.
Au cas de confiscation par la Douane ou Régie de Tabacs. Le client S'engage à :
- Régler le montant dû jusqu'à la date de confiscation.
- Régler le montant du prix du véhicule selon l'argus en vigueur.
- Régler tous les frais de procédure engagés contre lui.
- Régler tous les intérêts du retard au cas de non-paiement des sommes à leur temps.

ARTICLE 2 : Assurance - Accident
a. Le client a bien note qu'il était garanti, suivant les conditions générales des polices d'assurance contractées par la société du loueur et qu'il déclare en avoir pris connaissance.
b. Le véhicule est assuré contre le vol, l'incendie, la responsabilité civile, personnes transportées, défense et recours, dommage collision avec une franchise de 10 % sur la valeur d'achat à neuf, le poste radio, le Téléphone, les accessoires, Tous vêtements ou objets se trouvant à l'intérieur de la voiture, au Coffre, sur la galerie du toit de la voiture pour lesquels le client reste son propre assureur.
c. En cas d'accident le client devra payer au loueur la franchise de 10% sur la valeur d'achat à neuf. Aussi la location jusqu'à la réparation de la voiture.
- Le client devra déclarer au loueur sur le champ tout Accident, vol ou incendie même partiels dont ils pourraient être Victimes, sous peine de déchéance.
- Le client devra irrévocablement fournir au loueur, un constat amiable cacheté par les constateurs de l'assistance ou celui des autorités de polices ou de gendarmerie royale que l'accident soit corporel ou non.
- Le client devra obligatoirement de prendre des photos dans le lieu de l'accident.
- Le client ne devra en aucun cas discuter la responsabilité de l'accident ni traiter, ni transiger avec les tiers en un mot, ne faire aucun acte pouvant entraver ou engager la compagnie d'assurance dans le règlement du sinistre.
En aucun cas le nombre de personnes transportées dans la voiture louée, ne devra dépasser celui indiqué sur la police d'assurance Couvrant ledit véhicule sous peine de voir la seule responsabilité du client engagé.
d. La responsabilité du locataire ne sera pas dégagée en cas d'accident causé par sa faute, et supportera la totalité des dommages causés au véhicule ; et s'il n'est pas fautif il supportera l'immobilisation (au maximum 60 jours) de la valeur locative.

ARTICLE 3 : Location. Pré Paiement-Prolongation
a. Le montant de location est payable d'avance.
b. La journée de location commence à partir de l'heure de prise du véhicule. Toute journée commencée est due, si le client veut conserver le véhicule pour une durée supérieure à celle indiquée sur le contrat, il devra au préalable obtenir l'accord express et écrit du loueur et devra en outre verser au loueur le montant de la location supplémentaire, à défaut le client devra restituer le véhicule loué et s'acquitter du montant de la location supplémentaire.
Si le client ne restitue pas ledit véhicule dans un délai de 48 heures il sera considéré comme l'ayant détourné et sera passible de poursuites pénales pour vol, abus de confiance, et usant du véhicule Contre la volonté du loueur conformément aux Dispositions des articles 505 et 547 du code pénal Marocain.
Le loueur se réserve donc le droit de restituer son véhicule sans aucun préavis en faisant appel à un huissier de justice. Pour dissiper toute controverse, le seul moyen d'aviser notre société est l'email ou lettre recommandée avec accusé de réception.
c. La restitution du véhicule loué sera effectuée, au Bureau du loueur.
En cas de litige, le locataire, supportera tous les frais judiciaires engagées par le loueur ainsi que ceux d'enregistrement et éventuellement les amendes, taxes et droits que le loueur se verrait contrainte d'exposer.

ARTICLE 4 : Documents du Véhicule & Clés
a. Le client devra restituer, à la fin de la location en même temps que le véhicule, la carte grise et tous les autres documents nécessaires à la circulation, faute de quoi, la location continuera à être facturée au client au prix initial jusqu'à la récupération des pièces, ou l'établissement de leurs duplicatas facturés aussi au client.
En cas de perte de la clé de démarrage, le loueur devra signer un engagement dans ce sens et payer les frais de duplication de la nouvelle clé.
b. Le client s'engage à ne laisser quiconque conduire le véhicule que lui-même ou toute personne habilitée par le loueur (Par écrit) et assume sa pleine responsabilité en cas de prêt du véhicule à une tierce personne vis-à-vis du loueur aussi bien vis-à-vis des autorités locales et justices.

ARTICLE 5 : Remboursement
Le client s'engage à n'exiger au loueur aucun remboursement pour une durée de location non consommée.

ARTICLE 6 : Réparation de la Voiture par le Client
Le client s'engage à n'effectuer aucune réparation sur le véhicule Loué, sauf après accord écrit du loueur.

ARTICLE 7 : Autres Conditions Complémentaires
Le client s'engage à :
- Signer le bon de restitution du véhicule loué sur lequel sont indiquées les circonstances de retour.
- Signer le bon de recette au cas de versement.
- Signer le contrat à la prise du véhicule.
En cas de non-respect par le client de l'une ou l'autre des clauses contenues dans ce contrat, le loueur se réserve le droit de lui retirer le véhicule, sans préavis. En cas de contestation quelconque, le loueur a le choix de porter l'affaire soit devant les tribunaux de RABAT ou devant ceux de la résidence du client.

ARTICLE 8 : Contraventions
Le locataire reconnaît sa responsabilité toutes contraventions constatées automatiquement par radar.

ARTICLE 9 : GPS
Tous nos véhicules est équipé par un traceur GPS pour identifier la voiture en cas d'accident et pour suivre leur l'entretien.
`;

export function generateContractHTML(data: ContractData): string {
  const { nom, prenom } = splitCustomerName(data.customerName);
  const paymentLabel = getPaymentTypeLabel(data.paymentType);
  const contractNumber = data.bookingId.slice(0, 8).toUpperCase();
  const taxLine = [
    data.agencyPatente && `Patente: ${data.agencyPatente}`,
    data.agencyIF && `IF: ${data.agencyIF}`,
    data.agencyCNSS && `CNSS: ${data.agencyCNSS}`,
    data.agencyRC && `RC: ${data.agencyRC}`,
  ]
    .filter(Boolean)
    .join(" - ") || "Patente: — — IF: — — CNSS: XXXX — RC: XXXX";

  const checkbox = (checked: boolean) =>
    checked
      ? '<span class="cb checked">☑</span>'
      : '<span class="cb">☐</span>';

  const damageCount = data.damagePhotos.length;
  const hasDamage = damageCount > 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de Location - ${contractNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10px;
      line-height: 1.35;
      color: #1a1a1a;
      background: white;
    }
    .page { page-break-after: always; padding: 8px 12px; }
    .page:last-child { page-break-after: auto; }
    .header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #333;
    }
    .header h1 { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
    .header .agency-line { font-size: 9px; margin: 1px 0; }
    .header .tax-line { font-size: 8px; margin-top: 2px; color: #444; }
    .section { margin: 6px 0; }
    .section-title { font-size: 9px; font-weight: bold; margin-bottom: 3px; text-decoration: underline; }
    .form-row { display: flex; margin: 2px 0; align-items: baseline; }
    .form-label { min-width: 90px; font-size: 9px; }
    .form-value { flex: 1; border-bottom: 1px solid #333; padding: 0 4px; font-size: 9px; min-height: 14px; }
    .form-value.empty { color: #888; }
    .cb { font-size: 10px; margin-right: 2px; }
    .cb.checked { color: #000; }
    .cb:not(.checked) { color: #666; }
    .inline-cbs { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .inline-cb { display: flex; align-items: center; gap: 2px; }
    .totals { margin: 8px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px; }
    .total-row .label { font-weight: bold; }
    .signature-block { margin-top: 12px; padding-top: 8px; border-top: 1px solid #333; font-size: 8px; }
    .signatures-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 8px; }
    .sig-box { text-align: center; width: 22%; }
    .conditions { font-size: 8px; white-space: pre-wrap; text-align: justify; }
    .conditions h3 { font-size: 10px; margin: 6px 0 4px; }
    .annex-table { width: 100%; border-collapse: collapse; font-size: 8px; margin: 4px 0; }
    .annex-table td { border: 1px solid #ccc; padding: 3px; }
    .annex-table .check-col { width: 60px; text-align: center; }
    @media print {
      .page { padding: 5px; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

<!-- PAGE 1: Main Contract -->
<div class="page">
  <div class="header">
    <h1>${data.agencyName}</h1>
    <div class="agency-line">${data.agencyAddress}</div>
    <div class="agency-line">Tél : ${data.agencyPhone}</div>
    <div class="header tax-line">${taxLine}</div>
  </div>

  <div class="section">
    <div class="section-title">Autorisation de circulation :</div>
    <div class="form-row">
      <span class="form-label">FRANCHISE</span>
      <span class="form-value empty">${data.franchiseAmount || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Assurance "Tous risques" :</span>
      <div class="inline-cbs">
        <span class="inline-cb">${checkbox(data.hasFullInsurance ?? false)} Oui</span>
        <span class="inline-cb">${checkbox(!(data.hasFullInsurance ?? false))} Non</span>
      </div>
    </div>
    <div class="form-row">
      <span class="form-label">Visite Technique :</span>
      <span class="form-value"></span>
    </div>
    <div class="form-row">
      <span class="form-label">Attestation de paiement de vignette :</span>
      <span class="form-value"></span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ETAT DU VEHICULE</div>
    <div class="form-row">
      <span class="form-label">Observations :</span>
      <span class="form-value"></span>
    </div>
    <div class="totals">
      <div class="total-row">
        <span class="label">TOTAL GENERAL :</span>
        <span>${formatCurrencyDH(data.totalPrice)}</span>
      </div>
      <div class="total-row">
        <span class="label">MONTANT PAYE :</span>
        <span>${formatCurrencyDH(data.amountPaid)}</span>
      </div>
      <div class="total-row">
        <span class="label">LE RESTE A PAYER :</span>
        <span>${formatCurrencyDH(data.restToPay)}</span>
      </div>
    </div>
    <div class="form-row">
      <span class="form-label">Mode de Règlement</span>
      <div class="inline-cbs">
        <span class="inline-cb">${checkbox(isPaymentTypeChecked(data.paymentType, "cash"))} Espèce</span>
        <span class="inline-cb">${checkbox(isPaymentTypeChecked(data.paymentType, "cheque"))} Chèque</span>
        <span class="inline-cb">${checkbox(isPaymentTypeChecked(data.paymentType, "card"))} Carte bancaire</span>
        <span class="inline-cb">${checkbox(isPaymentTypeChecked(data.paymentType, "transfer"))} Virement</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PAPIERS DE VEHICULE</div>
    <div class="form-row">
      <span class="form-label">Carte grise :</span>
      <span class="form-value"></span>
    </div>
    <div class="form-row">
      <span class="form-label">Assurance :</span>
      <span class="form-value"></span>
    </div>
    <div class="form-row">
      <span class="form-label">Du :</span>
      <span class="form-value">${formatDate(data.startDate)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">au :</span>
      <span class="form-value">${formatDate(data.endDate)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Durée:</span>
      <span class="form-value">${data.numberOfDays} jour(s)</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">DURÉE DE LOCATION</div>
    <div class="form-row">
      <span class="form-label">Date et Heure Départ :</span>
      <span class="form-value">${formatDateTime(data.startDate)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Date et Heure Retour :</span>
      <span class="form-value">${formatDateTime(data.endDate)}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Durée de location :</span>
      <span class="form-value">${data.numberOfDays} jour(s)</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">LE LOCATAIRE</div>
    <div class="form-row">
      <span class="form-label">Nom :</span>
      <span class="form-value">${nom}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Prénom :</span>
      <span class="form-value">${prenom || data.customerName}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Date de naissance :</span>
      <span class="form-value">${data.customerDateOfBirth || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Adresse :</span>
      <span class="form-value">${data.customerAddress || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tél :</span>
      <span class="form-value">${data.phone}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Permis N° :</span>
      <span class="form-value">${data.customerLicenseNumber || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Délivré, le :</span>
      <span class="form-value">${data.customerLicenseIssueDate || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Nationalité :</span>
      <span class="form-value">${data.customerNationality || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">CIN N° :</span>
      <span class="form-value">${data.passportOrCIN}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Valable Jusqu'au :</span>
      <span class="form-value">${data.customerLicenseExpiry || "—"}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2ème CONDUCTEUR</div>
    <div class="form-row">
      <span class="form-value" style="min-width: 100%;">—</span>
    </div>
  </div>

  <div class="form-row" style="margin-top: 6px;">
    <span class="form-label">Fait le :</span>
    <span class="form-value">${formatDate(new Date())}</span>
  </div>
  <div class="form-row">
    <span class="form-label">Lieu de livraison :</span>
    <span class="form-value">${data.pickupLocation || "—"}</span>
  </div>
  <div class="form-row">
    <span class="form-label">Contrat de location N° :</span>
    <span class="form-value">${contractNumber}</span>
  </div>
  <div class="form-row">
    <span class="form-label">Marque :</span>
    <span class="form-value">${data.vehicleMake} ${data.vehicleModel}</span>
  </div>
  <div class="form-row">
    <span class="form-label">Immatriculation :</span>
    <span class="form-value">${data.vehiclePlate}</span>
  </div>
  <div class="form-row">
    <span class="form-label">Lieu de reprise :</span>
    <span class="form-value">${data.returnLocation || "—"}</span>
  </div>

  <p style="font-size: 8px; margin: 8px 0; text-align: justify;">
    J'ai lu et accepté les conditions stipulées ci-contre au verso de ce contrat. Le client est seul responsable des violations de la loi sur la circulation routière.
  </p>

  <div class="signatures-row">
    <div class="sig-box">Le Locataire</div>
    <div class="sig-box">2ème Conducteur</div>
    <div class="sig-box">Le Loueur</div>
    <div class="sig-box">Date et signature du retour<br>Date et Heure :<br>Lieu de retour :</div>
  </div>
</div>

<!-- PAGES 2-3: Conditions Générales -->
<div class="page">
  <div class="header">
    <h1>${data.agencyName}</h1>
    <div class="agency-line">${data.agencyAddress}</div>
    <div class="agency-line">Tél : ${data.agencyPhone}</div>
    <div class="header tax-line">${taxLine}</div>
  </div>
  <h3 class="section-title">Conditions Générales</h3>
  <div class="conditions">${CONDITIONS_GENERALES}</div>
  <div class="signature-block">
    <div class="form-row">
      <span class="form-label">Signature du locataire</span>
      <span class="form-value" style="flex: 2;"></span>
    </div>
    <div class="form-row" style="margin-top: 4px;">
      <span class="form-label">Fait le</span>
      <span class="form-value">${formatDate(new Date())}</span>
    </div>
  </div>
</div>

<!-- PAGE 4: Annex - Etat de lieu départ -->
<div class="page">
  <div class="header">
    <h1>${data.agencyName}</h1>
    <div class="agency-line">${data.agencyAddress}</div>
    <div class="agency-line">Tél : ${data.agencyPhone}</div>
    <div class="header tax-line">${taxLine}</div>
  </div>
  <h3 class="section-title">Annexe au CONTRAT DE LOCATION N° ${contractNumber} - Etat de lieu départ</h3>
  <p style="font-size: 10px; margin-bottom: 6px;">${data.vehicleMake} ${data.vehicleModel} - ${data.vehiclePlate}</p>
  <table class="annex-table">
    <tr>
      <td class="check-col">Niveau carburant</td>
      <td>kilométrage</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td></td>
      <td>${data.vehicleKm} Km</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td colspan="2"><strong>Papiers du véhicule</strong></td>
      <td colspan="2"><strong>État et Sécurité du Véhicule</strong></td>
    </tr>
    <tr>
      <td>Carte grise</td>
      <td class="check-col"></td>
      <td>Matériel de sécurité</td>
      <td class="check-col"></td>
    </tr>
    <tr>
      <td>Visite Technique</td>
      <td class="check-col"></td>
      <td>Niveau huiles, Liquide de refroidissement...</td>
      <td class="check-col"></td>
    </tr>
    <tr>
      <td>Assurance</td>
      <td class="check-col"></td>
      <td>Roue de secours/kit anti crevaison</td>
      <td class="check-col"></td>
    </tr>
    <tr>
      <td>Attestation de paiement de vignette</td>
      <td class="check-col"></td>
      <td>Propreté intérieure</td>
      <td class="check-col"></td>
    </tr>
    <tr>
      <td>Autorisation de circulation</td>
      <td class="check-col"></td>
      <td>Propreté extérieure</td>
      <td class="check-col"></td>
    </tr>
  </table>
  <div class="signature-block">
    <div class="form-row">
      <span class="form-label">Signature du locataire</span>
      <span class="form-value" style="flex: 2;"></span>
    </div>
    <div class="form-row" style="margin-top: 4px;">
      <span class="form-label">Fait le</span>
      <span class="form-value">${formatDate(new Date())}</span>
    </div>
  </div>
  <div class="section" style="margin-top: 12px;">
    <div class="section-title">Informations du client</div>
    <div class="form-row">
      <span class="form-label">Nom :</span>
      <span class="form-value">${nom}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Prénom :</span>
      <span class="form-value">${prenom || data.customerName}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Date de naissance :</span>
      <span class="form-value">${data.customerDateOfBirth || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Adresse :</span>
      <span class="form-value">${data.customerAddress || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Tél :</span>
      <span class="form-value">${data.phone}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Permis N° :</span>
      <span class="form-value">${data.customerLicenseNumber || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Délivré, le :</span>
      <span class="form-value">${data.customerLicenseIssueDate || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Nationalité :</span>
      <span class="form-value">${data.customerNationality || "—"}</span>
    </div>
    <div class="form-row">
      <span class="form-label">CIN N° :</span>
      <span class="form-value">${data.passportOrCIN}</span>
    </div>
    <div class="form-row">
      <span class="form-label">Valable Jusqu'au :</span>
      <span class="form-value">${data.customerLicenseExpiry || "—"}</span>
    </div>
  </div>
</div>

<!-- PAGE 5: Etat du véhicule - Damage photos -->
<div class="page">
  <div class="header">
    <h1>${data.agencyName}</h1>
    <div class="agency-line">${data.agencyAddress}</div>
    <div class="agency-line">Tél : ${data.agencyPhone}</div>
    <div class="header tax-line">${taxLine}</div>
  </div>
  <div class="section">
    <div class="section-title">Etat du véhicule (au départ) :</div>
    <div class="form-row">
      <span class="form-value" style="min-width: 100%;"></span>
    </div>
  </div>
  <div class="signature-block">
    <div class="form-row">
      <span class="form-label">Signature du locataire</span>
      <span class="form-value" style="flex: 2;"></span>
    </div>
    <div class="form-row" style="margin-top: 4px;">
      <span class="form-label">Fait le</span>
      <span class="form-value">${formatDate(new Date())}</span>
    </div>
  </div>
  <div class="section" style="margin-top: 12px;">
    <p style="font-size: 10px; font-weight: bold;">Photos des dommages (${damageCount})</p>
    ${
      hasDamage
        ? data.damagePhotos
            .map((p) => {
              const imgSrc = p.photoUrl.startsWith("/") && data.baseUrl
                ? `${data.baseUrl}${p.photoUrl}`
                : p.photoUrl;
              return `<div style="margin: 8px 0;"><img src="${imgSrc}" alt="Dommage" style="max-width: 200px; max-height: 150px; border: 1px solid #ccc;" /><br/><span style="font-size: 8px;">${p.description || ""}</span></div>`;
            })
            .join("")
        : '<p style="font-size: 9px; color: #444;">Aucun dommage n\'a été constaté sur le véhicule lors de sa livraison.</p>'
    }
  </div>
</div>

<!-- PAGE 6: Photos supplémentaires -->
<div class="page">
  <div class="header">
    <h1>${data.agencyName}</h1>
    <div class="agency-line">${data.agencyAddress}</div>
    <div class="agency-line">Tél : ${data.agencyPhone}</div>
    <div class="header tax-line">${taxLine}</div>
  </div>
  <div class="section">
    <div class="section-title">Photos supplémentaires :</div>
    <div class="form-row">
      <span class="form-value" style="min-width: 100%;"></span>
    </div>
  </div>
  <div class="signature-block">
    <div class="form-row">
      <span class="form-label">Signature du locataire</span>
      <span class="form-value" style="flex: 2;"></span>
    </div>
    <div class="form-row" style="margin-top: 4px;">
      <span class="form-label">Fait le</span>
      <span class="form-value">${formatDate(new Date())}</span>
    </div>
  </div>
  <p style="font-size: 9px; margin-top: 8px;">Photos supplémentaires (0)</p>
</div>

</body>
</html>
  `.trim();
}

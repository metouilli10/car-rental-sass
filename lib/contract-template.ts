import { formatCurrency, formatDate } from "./utils";

interface ContractData {
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
}

export function generateContractHTML(data: ContractData): string {
  const paymentTypeLabel =
    data.paymentType === "CASH"
      ? "Espèces"
      : data.paymentType === "CARD"
      ? "Carte bancaire"
      : "Virement";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de Location - ${data.bookingId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background: white;
      color: #333;
      line-height: 1.6;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }

    h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .agency-info {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }

    .section {
      margin: 25px 0;
      padding: 20px;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 15px;
    }

    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      width: 180px;
      color: #475569;
    }

    .info-value {
      flex: 1;
      color: #1e293b;
    }

    .total-section {
      margin: 30px 0;
      padding: 20px;
      background: #dbeafe;
      border-radius: 8px;
      border: 2px solid #2563eb;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }

    .total-row.grand-total {
      font-size: 20px;
      font-weight: 700;
      color: #2563eb;
      padding-top: 15px;
      border-top: 2px solid #2563eb;
      margin-top: 10px;
    }

    .terms {
      margin: 30px 0;
      padding: 20px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }

    .terms h3 {
      color: #d97706;
      margin-bottom: 10px;
    }

    .terms ul {
      margin-left: 20px;
      color: #78350f;
    }

    .terms li {
      margin: 8px 0;
    }

    .signatures {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }

    .signature-box {
      width: 45%;
      text-align: center;
    }

    .signature-line {
      margin-top: 60px;
      border-top: 2px solid #333;
      padding-top: 10px;
      font-weight: 600;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>
    <div class="agency-info">
      <strong>${data.agencyName}</strong><br>
      ${data.agencyAddress}<br>
      Tél: ${data.agencyPhone} | Email: ${data.agencyEmail}
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #94a3b8;">
      N° Contrat: ${data.bookingId.slice(0, 8).toUpperCase()}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations du Client</div>
    <div class="info-row">
      <div class="info-label">Nom complet:</div>
      <div class="info-value">${data.customerName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Passeport/CIN:</div>
      <div class="info-value">${data.passportOrCIN}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Téléphone:</div>
      <div class="info-value">${data.phone}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations du Véhicule</div>
    <div class="info-row">
      <div class="info-label">Véhicule:</div>
      <div class="info-value">${data.vehicleMake} ${data.vehicleModel}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Immatriculation:</div>
      <div class="info-value">${data.vehiclePlate}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Couleur:</div>
      <div class="info-value">${data.vehicleColor}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Période de Location</div>
    <div class="info-row">
      <div class="info-label">Date de début:</div>
      <div class="info-value">${formatDate(data.startDate)}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Date de fin:</div>
      <div class="info-value">${formatDate(data.endDate)}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Durée:</div>
      <div class="info-value">${data.numberOfDays} jour(s)</div>
    </div>
  </div>

  <div class="total-section">
    <div class="total-row">
      <span>Prix par jour:</span>
      <span>${formatCurrency(data.pricePerDay)}</span>
    </div>
    <div class="total-row">
      <span>Nombre de jours:</span>
      <span>${data.numberOfDays}</span>
    </div>
    <div class="total-row grand-total">
      <span>PRIX TOTAL:</span>
      <span>${formatCurrency(data.totalPrice)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Conditions de Paiement</div>
    <div class="info-row">
      <div class="info-label">Mode de paiement:</div>
      <div class="info-value">${paymentTypeLabel}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Caution:</div>
      <div class="info-value">${formatCurrency(data.depositAmount)}</div>
    </div>
  </div>

  <div class="terms">
    <h3>Conditions Générales</h3>
    <ul>
      <li>Le locataire s'engage à restituer le véhicule dans l'état où il l'a reçu.</li>
      <li>La caution sera restituée après vérification de l'état du véhicule.</li>
      <li>Le locataire est responsable de tous les dommages causés au véhicule pendant la période de location.</li>
      <li>Le véhicule doit être restitué avec le même niveau de carburant.</li>
      <li>Toute prolongation de la période de location doit être autorisée par l'agence.</li>
      <li>Le locataire doit être en possession d'un permis de conduire valide.</li>
    </ul>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        Le Locataire<br>
        ${data.customerName}
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        L'Agence<br>
        ${data.agencyName}
      </div>
    </div>
  </div>

  <div class="footer">
    Document généré le ${formatDate(new Date())}<br>
    Ce contrat est établi en deux exemplaires, chaque partie en conservant un.
  </div>
</body>
</html>
  `.trim();
}

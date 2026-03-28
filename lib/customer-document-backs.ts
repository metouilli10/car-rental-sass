import { Prisma } from "@prisma/client";

export const supportsCustomerDocumentBacks =
  Object.prototype.hasOwnProperty.call(Prisma.CustomerScalarFieldEnum, "passportPhotoBackUrl") &&
  Object.prototype.hasOwnProperty.call(Prisma.CustomerScalarFieldEnum, "licensePhotoBackUrl");

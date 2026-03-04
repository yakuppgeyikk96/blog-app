import { Type } from "@sinclair/typebox";

const UploadImageResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    url: Type.String(),
  }),
});

export const uploadImageSchema = {
  response: { 201: UploadImageResponse },
};

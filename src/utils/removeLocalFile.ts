import { unlink } from "fs/promises";

export const removeFile = async (oldImgUrl: string) => {
  const oldImgUrlParts = oldImgUrl.split("/");
  const oldImgName = oldImgUrlParts[oldImgUrlParts.length - 1];
  const oldImgPath = "public/uploads/" + oldImgName;

  await unlink(oldImgPath);
};

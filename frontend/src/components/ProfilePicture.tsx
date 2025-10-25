import { BACKEND_URL } from "@/query/client";
import DefaultProfilePic from "@/assets/defaultProfilePicture.webp";
import { h } from "refreshjs";
import { cn } from "@/components/utils";

const imageClassName =
  "object-cover w-10 h-10 rounded-full border-2 border-primary";

export function ProfilePicture(props: {
  profilePictureId?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <img
      class={cn(imageClassName, props.className)}
      src={
        props.profilePictureId
          ? `${BACKEND_URL}/users/profilePicture/${props.profilePictureId}`
          : DefaultProfilePic
      }
      alt="Profile Picture"
    />
  );
}

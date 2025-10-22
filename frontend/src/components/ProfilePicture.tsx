import { BACKEND_URL } from "@/query/client";
import DefaultProfilePic from "@/assets/defaultProfilePicture.webp";
import { h } from "refreshjs";
import { cn } from "@/components/utils";

const imageClassName = "object-cover w-12 h-12 rounded-full border-2 border-primary";

export function ProfilePicture(props: {
  profilePictureId?: string;
  className?: string;
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

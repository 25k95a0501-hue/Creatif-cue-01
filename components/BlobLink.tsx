import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type BlobVariant = "navy" | "cream";
type BlobSize = "default" | "small" | "large";

type BlobContentsProps = {
  children: ReactNode;
  icon?: ReactNode;
  size?: BlobSize;
  variant?: BlobVariant;
  className?: string;
};

function BlobContents({
  children,
  icon,
  size = "default",
  variant = "navy",
  className,
}: BlobContentsProps) {
  return (
    <span className={`blob-control blob-control--${variant} blob-control--${size}${className ? ` ${className}` : ""}`}>
      <span className="blob-control__label">{children}</span>
      <span className="blob-control__icon" aria-hidden="true">
        {icon ?? <ArrowUpRight size={18} strokeWidth={1.8} />}
      </span>
    </span>
  );
}

type BlobLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "className"> &
  BlobContentsProps;

export function BlobLink({
  children,
  icon,
  size,
  variant,
  className,
  ...linkProps
}: BlobLinkProps) {
  return (
    <Link className="blob-link" {...linkProps}>
      <BlobContents
        className={className}
        icon={icon}
        size={size}
        variant={variant}
      >
        {children}
      </BlobContents>
    </Link>
  );
}

type BlobButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "className"> &
  BlobContentsProps;

export function BlobButton({
  children,
  icon,
  size,
  variant,
  className,
  type = "button",
  ...buttonProps
}: BlobButtonProps) {
  return (
    <button className="blob-link" type={type} {...buttonProps}>
      <BlobContents
        className={className}
        icon={icon}
        size={size}
        variant={variant}
      >
        {children}
      </BlobContents>
    </button>
  );
}

type BlobAffordanceProps = BlobContentsProps;

export function BlobAffordance(props: BlobAffordanceProps) {
  return <BlobContents {...props} />;
}

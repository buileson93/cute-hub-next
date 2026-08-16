import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      offset={72}
      expand
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          title: "group-[.toast]:font-medium group-[.toast]:text-sm",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:text-[13px] group-[.toast]:leading-relaxed group-[.toast]:whitespace-pre-wrap group-[.toast]:break-words",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          width: "min(420px, calc(100vw - 2rem))",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

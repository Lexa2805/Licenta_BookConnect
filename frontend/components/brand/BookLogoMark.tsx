type BookLogoMarkProps = {
  size?: "sm" | "lg";
};

const sizeClasses = {
  sm: {
    wrapper: "h-10 w-10",
    image: "h-10 w-10",
  },
  lg: {
    wrapper: "h-16 w-16",
    image: "h-16 w-16",
  },
};

export function BookLogoMark({ size = "lg" }: BookLogoMarkProps) {
  const classes = sizeClasses[size];

  return (
    <div className={`${classes.wrapper} inline-flex items-center justify-center`}>
      <img
        src="/images/book.png"
        alt=""
        className={`${classes.image} object-contain drop-shadow-[0_8px_14px_rgba(45,30,18,0.18)]`}
        aria-hidden="true"
      />
    </div>
  );
}

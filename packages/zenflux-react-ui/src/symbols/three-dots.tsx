export function ThreeDots ( props: {
    className?: string;
    innerRef?: any
} ) {
    const style = props.className ? {} : {fill: "#B2BBD5"};

    return (
            <span className={props.className} ref={props.innerRef}>
                <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                            d="M10 2C10 0.9 9.1 -3.01609e-07 8 -3.49691e-07C6.9 -3.97774e-07 6 0.9 6 2C6 3.1 6.9 4 8 4C9.1 4 10 3.1 10 2ZM16 2C16 0.9 15.1 -3.93402e-08 14 -8.74228e-08C12.9 -1.35505e-07 12 0.9 12 2C12 3.1 12.9 4 14 4C15.1 4 16 3.1 16 2ZM4 2C4 0.899999 3.1 -5.63877e-07 2 -6.11959e-07C0.9 -6.60042e-07 -3.93403e-08 0.899999 -8.74228e-08 2C-1.35505e-07 3.1 0.899999 4 2 4C3.1 4 4 3.1 4 2Z"
                            style={ style }
                    />
                </svg>
            </span>
    );
}

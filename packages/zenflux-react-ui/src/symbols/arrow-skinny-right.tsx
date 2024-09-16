export const ArrowSkinnyRight = ( props: {
    onClick: () => void;
} ) => {
    return (
        <svg className="arrow-skinny" onClick={ () => props.onClick() } xmlns="http://www.w3.org/2000/svg" width="4" height="7" viewBox="0 0 4 7"
             fill="none">
            <path
                d="M-3.09592e-08 6.29174L0.708373 7L4 3.49803L0.708373 -3.0964e-08L-2.75365e-07 0.700393L2.62175 3.49803L-3.09592e-08 6.29174Z"
                fill="#98A4C6"/>
        </svg>
    );
};

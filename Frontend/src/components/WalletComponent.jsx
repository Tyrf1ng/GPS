import { useEffect, useRef } from 'react';
import { Wallet } from '@mercadopago/sdk-react';

const WalletComponent = ({ preferenceId, onReady, onError }) => {
  const walletRef = useRef(null);

  return (
    <div ref={walletRef} className="wallet-container">
      <Wallet
        initialization={{ preferenceId }}
        customization={{
          texts: { valueProp: "smart_option" },
          theme: "default",
        }}
        onReady={() => {
          console.log("🟢 Wallet Brick listo");
          if (onReady) onReady();
        }}
        onError={(error) => {
          console.error("🔴 Error en el Brick:", error);
          if (onError) onError(error);
        }}
      />
    </div>
  );
};

export default WalletComponent;
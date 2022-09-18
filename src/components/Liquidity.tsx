import './Liquidity.css';
import AddLiquidity from './AddLiquidity';
import RemoveLiquidity from './RemoveLiquidity';

function Liquidity() {
  return (
    <div className="flex justify-center">
      <div className="Liquidity-container">
        <AddLiquidity />
      </div>
      <div className="Liquidity-container ml-6">
        <RemoveLiquidity />
      </div>
    </div>
  );
}

export default Liquidity;

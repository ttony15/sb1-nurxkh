import React, { useState, useEffect } from 'react';
import { Calculator, ChevronDown, ChevronUp, HelpCircle, LogIn, LogOut, ExternalLink, Loader } from 'lucide-react';

// In a real app, this would be stored securely on the server
const ADMIN_PASSWORD = 'ZachMan1533@gmail.com';

const TOTAL_ENKI_AIRDROP = 400000; // 400,000 ENKI
const ATH_PRICE = 18.38; // All-time high price in USD

const API_URL = 'https://prod.api.enkixyz.com/';

function App() {
  const [stakingPoints, setStakingPoints] = useState<string>('');
  const [estimatedReward, setEstimatedReward] = useState<number | null>(null);
  const [showCalculations, setShowCalculations] = useState(false);
  const [enkiPrice, setEnkiPrice] = useState<number | null>(null);
  const [totalStakingPoints, setTotalStakingPoints] = useState<number>(() => {
    const saved = localStorage.getItem('totalStakingPoints');
    return saved ? parseFloat(saved) : 2.68e9;
  });
  const [showGuide, setShowGuide] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [boostMultiplier, setBoostMultiplier] = useState<number>(1);
  const [userAddress, setUserAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const formatStakingPoints = (points: string | number): string => {
    const numPoints = typeof points === 'string' ? parseFloat(points) : points;
    const formattedPoints = (numPoints / 1e18).toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
    return formattedPoints;
  };

  useEffect(() => {
    fetchEnkiPrice();
    fetchGlobalStakingPoints();
  }, []);

  useEffect(() => {
    localStorage.setItem('totalStakingPoints', totalStakingPoints.toString());
  }, [totalStakingPoints]);

  const fetchEnkiPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=enki-protocol&vs_currencies=usd');
      const data = await response.json();
      setEnkiPrice(data['enki-protocol'].usd);
    } catch (error) {
      console.error('Error fetching ENKI price:', error);
    }
  };

  const fetchGlobalStakingPoints = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              globalStakingPoints {
                points
              }
            }
          `,
        }),
      });
      const data = await response.json();
      if (data.data && data.data.globalStakingPoints) {
        setTotalStakingPoints(data.data.globalStakingPoints.points);
      }
    } catch (error) {
      console.error('Error fetching global staking points:', error);
    }
  };

  const fetchUserStakingPoints = async (address: string) => {
    setIsLoading(true);
    setAddressError(null);
    setStakingPoints('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query ($user: String!) {
              stakingPoints(user: $user) {
                points
              }
            }
          `,
          variables: {
            user: address,
          },
        }),
      });
      const data = await response.json();
      if (data.data && data.data.stakingPoints) {
        const points = data.data.stakingPoints.points;
        if (points === 0) {
          setAddressError("This wallet has no staking points. Make sure you've staked ENKI tokens.");
        } else {
          setStakingPoints(points.toString());
        }
      } else {
        setAddressError("No staking points found for this address. Make sure it's correct and you've staked ENKI tokens.");
      }
    } catch (error) {
      console.error('Error fetching user staking points:', error);
      setAddressError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateReward = (points: number) => {
    return (points / totalStakingPoints) * TOTAL_ENKI_AIRDROP;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const points = parseFloat(stakingPoints);
    if (!isNaN(points) && points > 0) {
      setEstimatedReward(calculateReward(points));
      setBoostMultiplier(1); // Reset boost multiplier on new calculation
    } else {
      setEstimatedReward(null);
    }
  };

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminPassword('');
      setShowAdminLogin(false);
      setError(null);
    } else {
      setError('Invalid password');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
  };

  const handleUpdateTotalStakingPoints = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newTotalStakingPoints = parseFloat(form.totalStakingPoints.value);
    if (!isNaN(newTotalStakingPoints) && newTotalStakingPoints > 0) {
      setTotalStakingPoints(newTotalStakingPoints);
      setError(null);
    } else {
      setError('Invalid total staking points');
    }
  };

  const handleBoost = (multiplier: number) => {
    setBoostMultiplier(multiplier);
  };

  const handleUserAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userAddress) {
      fetchUserStakingPoints(userAddress);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 flex items-center justify-center p-4">
      <div className="bg-yellow-50 rounded-lg shadow-xl p-8 w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-800 text-center mb-2">ENKI Staking Rewards Calculator</h1>
          <p className="text-yellow-600 text-center">Estimate your ENKI airdrop rewards based on your staking points</p>
        </div>
        <form onSubmit={handleUserAddressSubmit} className="space-y-4 mb-4">
          <div>
            <label htmlFor="userAddress" className="block text-sm font-medium text-yellow-700 mb-1">
              Your Wallet Address
            </label>
            <input
              type="text"
              id="userAddress"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-100"
              placeholder="Enter your wallet address"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition duration-300 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Calculator className="w-5 h-5 mr-2" />}
            {isLoading ? 'Fetching...' : 'Fetch Staking Points'}
          </button>
        </form>
        {addressError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{addressError}</p>
          </div>
        )}
        {stakingPoints && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="stakingPoints" className="block text-sm font-medium text-yellow-700 mb-1">
                Your Staking Points
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="stakingPoints"
                  value={formatStakingPoints(stakingPoints)}
                  readOnly
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-100"
                />
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-600 hover:text-yellow-700"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition duration-300 flex items-center justify-center"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Reward
            </button>
          </form>
        )}
        {showGuide && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">How to find your staking points:</h4>
            <ol className="list-decimal list-inside text-yellow-700">
              <li>Go to <a href="https://www.enkixyz.com/portfolio" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">https://www.enkixyz.com/portfolio</a></li>
              <li>Connect your wallet</li>
              <li>Find your staking points under "Staking Rewards"</li>
            </ol>
          </div>
        )}
        <div className="mt-6 space-y-2">
          <p className="text-sm text-yellow-700">
            Total Staking Points: <span className="font-semibold">{formatStakingPoints(totalStakingPoints)}</span>
          </p>
          <p className="text-sm text-yellow-700">
            Total ENKI Airdrop: <span className="font-semibold">{TOTAL_ENKI_AIRDROP.toLocaleString()} ENKI</span>
          </p>
          {enkiPrice !== null && (
            <p className="text-sm text-yellow-700">
              Current ENKI Price: <span className="font-semibold">${enkiPrice.toFixed(4)} USD</span>
            </p>
          )}
          {estimatedReward !== null && (
            <div className="bg-yellow-200 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="text-yellow-800">
                Estimated Reward: <span className="font-bold">{(estimatedReward * boostMultiplier).toFixed(2)} ENKI</span>
              </p>
              {enkiPrice !== null && (
                <>
                  <p className="text-yellow-800 mt-2">
                    Estimated Value: <span className="font-bold">${(estimatedReward * enkiPrice * boostMultiplier).toFixed(2)} USD</span>
                  </p>
                  <p className="text-yellow-800 mt-2">
                    Estimated Value at ATH: <span className="font-bold">${(estimatedReward * ATH_PRICE * boostMultiplier).toFixed(2)} USD</span>
                  </p>
                </>
              )}
              <div className="mt-4 flex flex-wrap items-center space-x-2">
                <button
                  onClick={() => handleBoost(2)}
                  className={`px-4 py-2 rounded-md ${boostMultiplier === 2 ? 'bg-yellow-600 text-white' : 'bg-yellow-300 text-yellow-800'} hover:bg-yellow-500 transition duration-300`}
                >
                  2x BOOST
                </button>
                <button
                  onClick={() => handleBoost(5)}
                  className={`px-4 py-2 rounded-md ${boostMultiplier === 5 ? 'bg-yellow-600 text-white' : 'bg-yellow-300 text-yellow-800'} hover:bg-yellow-500 transition duration-300`}
                >
                  5x BOOST
                </button>
                <button
                  onClick={() => handleBoost(10)}
                  className={`px-4 py-2 rounded-md ${boostMultiplier === 10 ? 'bg-yellow-600 text-white' : 'bg-yellow-300 text-yellow-800'} hover:bg-yellow-500 transition duration-300`}
                >
                  10x BOOST
                </button>
                <a
                  href="https://www.enkixyz.com/defi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-800 transition duration-300 mt-2 sm:mt-0"
                >
                  How to boost? <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowCalculations(!showCalculations)}
            className="flex items-center text-yellow-600 hover:text-yellow-700 transition duration-300 mt-4"
          >
            {showCalculations ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {showCalculations ? 'Hide Calculations' : 'Show Calculations'}
          </button>
          {showCalculations && estimatedReward !== null && (
            <div className="bg-yellow-100 p-4 rounded-md mt-2">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Calculation Breakdown</h3>
              <p className="text-sm text-yellow-700 mb-1">
                Your Staking Points: {formatStakingPoints(stakingPoints)}
              </p>
              <p className="text-sm text-yellow-700 mb-1">
                Total Staking Points: {formatStakingPoints(totalStakingPoints)}
              </p>
              <p className="text-sm text-yellow-700 mb-1">
                Total ENKI Airdrop: {TOTAL_ENKI_AIRDROP.toLocaleString()} ENKI
              </p>
              <p className="text-sm text-yellow-700 mb-1">
                Formula: (Your Staking Points / Total Staking Points) × Total ENKI Airdrop
              </p>
              <p className="text-sm text-yellow-700">
                Calculation: ({formatStakingPoints(stakingPoints)} / {formatStakingPoints(totalStakingPoints)}) × {TOTAL_ENKI_AIRDROP.toLocaleString()} = {estimatedReward.toFixed(2)} ENKI
              </p>
              {enkiPrice !== null && (
                <>
                  <p className="text-sm text-yellow-700 mt-1">
                    USD Value: {estimatedReward.toFixed(2)} ENKI × ${enkiPrice.toFixed(4)} = ${(estimatedReward * enkiPrice).toFixed(2)} USD
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    USD Value at ATH: {estimatedReward.toFixed(2)} ENKI × ${ATH_PRICE.toFixed(2)} = ${(estimatedReward * ATH_PRICE).toFixed(2)} USD
                  </p>
                </>
              )}
              {boostMultiplier > 1 && (
                <p className="text-sm text-yellow-700 mt-1">
                  Boosted Reward: {estimatedReward.toFixed(2)} ENKI × {boostMultiplier}x = {(estimatedReward * boostMultiplier).toFixed(2)} ENKI
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-right">
          {!isAdmin && (
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-xs text-yellow-600 hover:text-yellow-700 underline"
            >
              Admin Login
            </button>
          )}
          {showAdminLogin && (
            <form onSubmit={handleAdminLogin} className="mt-2 flex justify-end items-center space-x-2">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin Password"
                className="px-2 py-1 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-100"
              />
              <button
                type="submit"
                className="bg-yellow-600 text-white py-1 px-2 rounded-md hover:bg-yellow-700 transition duration-300 flex items-center justify-center text-sm"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </button>
            </form>
          )}
          {isAdmin && (
            <div className="mt-4 space-y-4">
              <form onSubmit={handleUpdateTotalStakingPoints} className="space-y-2">
                <div>
                  <label htmlFor="totalStakingPoints" className="block text-sm font-medium text-yellow-700 mb-1">
                    Update Total Staking Points
                  </label>
                  <input
                    type="number"
                    id="totalStakingPoints"
                    name="totalStakingPoints"
                    defaultValue={totalStakingPoints}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-100"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition duration-300"
                >
                  Update Total Staking Points
                </button>
              </form>
              <button
                onClick={handleAdminLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300 flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
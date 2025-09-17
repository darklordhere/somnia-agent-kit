import { ethers, parseEther } from "ethers";
import { getSigner, getProvider } from "../../core/client";

export const transferSOMI = async ({
  toAddress,
  amount
}: {
  toAddress: string;
  amount: string | number;
}): Promise<string> => {
  try {
    if (!toAddress) {
      throw new Error("Recipient address is required");
    }
    
    if (!amount || Number(amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address format");
    }

    const signer = getSigner();
    const provider = getProvider();
    
    if (!signer) {
      throw new Error("Signer not initialized");
    }

    if (!provider) {
      throw new Error("Provider not initialized");
    }

    const currentBalance = await provider.getBalance(signer.address);
    const amountInWei = parseEther(amount.toString());
    
    const gasEstimate = await provider.estimateGas({
      to: toAddress,
      value: amountInWei,
      from: signer.address
    });
    
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || parseEther("0.000000001");
    
    const gasCost = gasEstimate * gasPrice;
    const totalRequired = amountInWei + gasCost;
    
    if (currentBalance < totalRequired) {
      const currentBalanceFormatted = ethers.formatEther(currentBalance);
      const totalRequiredFormatted = ethers.formatEther(totalRequired);
      const gasCostFormatted = ethers.formatEther(gasCost);
      throw new Error(
        `Insufficient SOMI balance. Current: ${currentBalanceFormatted} SOMI, ` +
        `Required: ${totalRequiredFormatted} SOMI (${amount} SOMI + ${gasCostFormatted} SOMI gas)`
      );
    }

    console.log(`Transferring ${amount} SOMI to ${toAddress}...`);
    
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: amountInWei,
      gasLimit: gasEstimate
    });
    
    console.log(`SOMI transfer transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    if (!receipt) {
      throw new Error("Transaction receipt not available");
    }
    
    if (receipt.status !== 1) {
      throw new Error("Transaction failed");
    }
    
    console.log(`✅ SOMI transfer completed successfully. Transaction hash: ${tx.hash}`);
    return tx.hash;
    
  } catch (error: any) {
    console.error("SOMI transfer failed:", error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Insufficient funds for gas fees");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error during transfer");
    } else if (error.code === 'TIMEOUT') {
      throw new Error("Transfer transaction timed out");
    } else if (error.message.includes("insufficient funds")) {
      throw new Error("Insufficient SOMI balance for transfer and gas fees");
    } else if (error.message.includes("gas")) {
      throw new Error("Gas estimation failed or gas limit exceeded");
    }
    
    throw new Error(`SOMI transfer failed: ${error.message}`);
  }
};



// example.ts or test.ts
import { OKXDexClient } from '../../index';
import 'dotenv/config';

const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!
});

// Configuration - Update these values
const WALLET_ADDRESS = '0xa418223777cd2fc6a62388b18386114dadcbd121'; // Replace with your wallet address
const CHAIN_INDEX = '8453'; // Base mainnet
const ORDER_ID = '31bcfab737dacfc4171b257ff5d2b8effe25b350'; // Replace with your order ID

async function trackOrder(orderId: string, walletAddress: string, chainIndex: string) {
    console.log('=== Order Tracking ===');
    console.log('Order ID:', orderId);
    console.log('Wallet Address:', walletAddress);
    console.log('Chain Index:', chainIndex);
    
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes with 3-second intervals
    
    while (attempts < maxAttempts) {
        try {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            
            // First try to get the specific order
            let orders = await client.dex.getTransactionOrders({
                address: walletAddress,
                chainIndex: chainIndex,
                orderId: orderId
            });

            // If specific order not found, get all recent orders and find ours
            if (!orders.data.length || !orders.data[0].orders.length) {
                console.log(`📊 Check ${attempts + 1}: Specific order not found, checking recent orders...`);
                orders = await client.dex.getTransactionOrders({
                    address: walletAddress,
                    chainIndex: chainIndex,
                    limit: '20'
                });
            }

            let foundOrder = null;
            if (orders.data.length > 0 && orders.data[0].orders.length > 0) {
                // Look for our specific order ID in the results
                foundOrder = orders.data[0].orders.find(order => order.orderId === orderId);
                
                if (!foundOrder) {
                    // If not found by orderId, check if user wants to track latest order
                    console.log(`📊 Check ${attempts + 1}: Order ${orderId} not found in recent orders`);
                    console.log('Available orders:');
                    orders.data[0].orders.slice(0, 3).forEach((order, index) => {
                        console.log(`  ${index + 1}. ${order.orderId} - ${getStatusText(order.txStatus)} - ${order.txHash}`);
                    });
                }
            }

            if (foundOrder) {
                console.log(`📊 Status Check ${attempts + 1}:`);
                console.log('- Order ID:', foundOrder.orderId);
                console.log('- Status:', getStatusText(foundOrder.txStatus));
                console.log('- Transaction Hash:', foundOrder.txHash);
                
                if (foundOrder.failReason && foundOrder.failReason.trim() !== '') {
                    console.log('- Failure Reason:', foundOrder.failReason);
                }

                // Check if transaction is complete (success or failed)
                if (foundOrder.txStatus === '2') {
                    console.log('\n🎉 Transaction completed successfully!');
                    console.log('- Final Transaction Hash:', foundOrder.txHash);
                    console.log('- Explorer URL:', `https://web3.okx.com/explorer/base/tx/${foundOrder.txHash}`);
                    return { success: true, txHash: foundOrder.txHash };
                } else if (foundOrder.txStatus === '3') {
                    console.log('\n❌ Transaction failed');
                    console.log('- Failure Reason:', foundOrder.failReason);
                    return { success: false, txHash: foundOrder.txHash, reason: foundOrder.failReason };
                }
            } else {
                console.log(`📊 Check ${attempts + 1}: Order not found yet, transaction may still be processing...`);
            }
            
            attempts++;
        } catch (error) {
            console.error('Error checking transaction status:', error);
            attempts++;
        }
    }

    console.log('\n⏰ Transaction status tracking timed out');
    console.log('- You can check the status manually using the order ID:', orderId);
    return { success: false, timedOut: true };
}

async function getAllOrders(walletAddress: string, chainIndex: string, limit: string = '10') {
    console.log('=== Recent Orders ===');
    console.log('Wallet Address:', walletAddress);
    console.log('Chain Index:', chainIndex);
    
    try {
        const orders = await client.dex.getTransactionOrders({
            address: walletAddress,
            chainIndex: chainIndex,
            limit: limit
        });

        if (orders.data.length > 0 && orders.data[0].orders.length > 0) {
            console.log(`\nFound ${orders.data[0].orders.length} recent orders:`);
            orders.data[0].orders.forEach((order, index) => {
                console.log(`\n${index + 1}. Order ID: ${order.orderId}`);
                console.log(`   Status: ${getStatusText(order.txStatus)}`);
                console.log(`   Transaction Hash: ${order.txHash}`);
                console.log(`   Chain: ${order.chainIndex}`);
                if (order.failReason && order.failReason.trim() !== '') {
                    console.log(`   Failure Reason: ${order.failReason}`);
                }
            });
        } else {
            console.log('No recent orders found');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case '1': return 'Pending';
        case '2': return 'Success';
        case '3': return 'Failed';
        case '0': return 'Submitted';
        case 'pending': return 'Pending';
        case 'success': return 'Success';
        case 'failed': return 'Failed';
        default: return `Unknown (${status})`;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage examples:');
        console.log('  Track specific order: npm run track-order -- track <orderId> <walletAddress> <chainIndex>');
        console.log('  List recent orders: npm run track-order -- list <walletAddress> <chainIndex> [limit]');
        console.log('');
        console.log('Example:');
        console.log('  npm run track-order -- track 59bbfdad91cbf476438bc829271da19ae8965d9b 0xa418223777cd2fc6a62388b18386114dadcbd121 8453');
        console.log('  npm run track-order -- list 0xa418223777cd2fc6a62388b18386114dadcbd121 8453 5');
        return;
    }

    const command = args[0];
    
    if (command === 'track') {
        if (args.length < 4) {
            console.error('Error: track command requires orderId, walletAddress, and chainIndex');
            return;
        }
        const [, orderId, walletAddress, chainIndex] = args;
        await trackOrder(orderId, walletAddress, chainIndex);
    } else if (command === 'list') {
        if (args.length < 3) {
            console.error('Error: list command requires walletAddress and chainIndex');
            return;
        }
        const [, walletAddress, chainIndex, limit] = args;
        await getAllOrders(walletAddress, chainIndex, limit || '10');
    } else {
        console.error('Unknown command. Use "track" or "list"');
    }
}

main();
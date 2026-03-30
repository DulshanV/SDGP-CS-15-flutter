import 'package:flutter/material.dart';

class TaxCalculatorPage extends StatefulWidget {
  final String hsCode;
  final String description;

  const TaxCalculatorPage({
    Key? key,
    required this.hsCode,
    required this.description,
  }) : super(key: key);

  @override
  State<TaxCalculatorPage> createState() => _TaxCalculatorPageState();
}

class _TaxCalculatorPageState extends State<TaxCalculatorPage> {
  final TextEditingController _smartInputController = TextEditingController();
  
  bool _isCalculating = false;
  bool _showResults = false;

  // Real state variables waiting for backend connection
  double? _cifValue;
  double? _dutyAmount;
  double? _palAmount;
  double? _vatAmount;
  double? _totalTax;
  double? _grandTotal;

  @override
  void dispose() {
    _smartInputController.dispose();
    super.dispose();
  }

  Future<void> _handleCalculate() async {
    FocusScope.of(context).unfocus();

    setState(() {
      _isCalculating = true;
      _showResults = false;
    });

    // Simulating a backend loading state for the UI
    await Future.delayed(const Duration(milliseconds: 1200));

    setState(() {
      _cifValue = 0.00;
      _dutyAmount = 0.00;
      _palAmount = 0.00;
      _vatAmount = 0.00;
      _totalTax = 0.00;
      _grandTotal = 0.00;
      
      _isCalculating = false;
      _showResults = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50], 
      appBar: AppBar(
        title: const Text('Duty & Tax Calculator', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: const Color(0xFF133665), 
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              height: 40,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF133665), Color(0xFF3A9EEA)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 16),
                  _buildContextCard(),
                  const SizedBox(height: 24),
                  _buildSmartInputParser(),
                  const SizedBox(height: 24),
                  
                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF133665),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 2,
                      ),
                      onPressed: _isCalculating ? null : _handleCalculate,
                      child: _isCalculating
                          ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.calculate_outlined, color: Colors.white),
                                SizedBox(width: 8),
                                Text('Calculate Payable Tax', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  if (_showResults) _buildResultsReceipt(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContextCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("TARGET CLASSIFICATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF3A9EEA), letterSpacing: 1.2)),
          const SizedBox(height: 6),
          Text(widget.hsCode, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0B3EA8), fontFamily: 'Courier')),
          const SizedBox(height: 6),
          Text(widget.description, style: TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.4)),
          const Divider(height: 30),
          Row(
            children: [
              Icon(Icons.api, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 8),
              Text("Rates pending backend connection", style: TextStyle(fontSize: 12, color: Colors.grey[500], fontStyle: FontStyle.italic)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildSmartInputParser() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: const Row(
              children: [
                Icon(Icons.document_scanner_outlined, size: 18, color: Color(0xFF133665)),
                SizedBox(width: 8),
                Text("Smart Input Parser", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _smartInputController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: "Paste raw invoice text or notes here...\ne.g., 'CIF Value is 150,000 LKR. Note: Duty is 10%.'",
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF3A9EEA), width: 2)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsReceipt() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              color: Color(0xFF133665),
              borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
            ),
            child: const Row(
              children: [
                Icon(Icons.receipt_long, color: Colors.white, size: 20),
                SizedBox(width: 10),
                Text("Official Tax Breakdown", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                _buildReceiptRow("Declared CIF Base Value", _cifValue),
                _buildReceiptRow("General Customs Duty", _dutyAmount),
                _buildReceiptRow("Ports & Airports Levy (PAL)", _palAmount),
                _buildReceiptRow("Value Added Tax (VAT)", _vatAmount),
                
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12.0),
                  child: Divider(height: 1, thickness: 1, color: Colors.black12),
                ),
                
                _buildReceiptRow("Total Payable Tax", _totalTax, isBold: true, valueColor: Colors.red[600]),
                
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [Colors.green.shade50, Colors.teal.shade50]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade100),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Grand Total", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green[900])),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text("${_grandTotal?.toStringAsFixed(2)}", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.green[800])),
                          Padding(
                            padding: const EdgeInsets.only(left: 4, bottom: 2),
                            child: Text("LKR", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green[700])),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, double? amount, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: isBold ? Colors.black87 : Colors.grey[600], fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(
            "${amount?.toStringAsFixed(2)} LKR",
            style: TextStyle(
              fontSize: isBold ? 16 : 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
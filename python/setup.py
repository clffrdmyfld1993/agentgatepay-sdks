"""
AgentGatePay Python SDK
Official Python SDK for AgentGatePay - Payment gateway for AI agents
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="agentgatepay-sdk",
    version="1.1.6",
    author="AgentGatePay",
    author_email="support@agentgatepay.com",
    description="Official Python SDK for AgentGatePay - Secure Payment Gateway for AI agents",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/AgentGatePay/agentgatepay-sdks",
    project_urls={
        "Bug Tracker": "https://github.com/AgentGatePay/agentgatepay-sdks/issues",
        "Documentation": "https://docs.agentgatepay.io",
        "Source Code": "https://github.com/AgentGatePay/agentgatepay-sdks/tree/main/python",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.31.0",
        "typing-extensions>=4.0.0; python_version < '3.10'",
    ],
    extras_require={
        "web3": ["web3>=6.0.0"],
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "pylint>=2.17.0",
        ],
    },
    keywords=[
        "agentgatepay",
        "agent-gateway",
        "payments",
        "ai-agents",
        "crypto",
        "web3",
        "ap2",
        "x402",
        "usdc",
        "ethereum",
        "base",
        "polygon",
        "arbitrum",
        "payment-gateway",
        "agent-economy",
    ],
)

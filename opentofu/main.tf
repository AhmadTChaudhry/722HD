terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Define variables that will be passed in from the CI/CD pipeline
variable "resource_group_name" {
  type        = string
  description = "The name of the Azure Resource Group."
}

variable "acr_name" {
  type        = string
  description = "The name of the Azure Container Registry."
}

variable "cluster_name" {
  type        = string
  description = "The name of the Azure Kubernetes Service cluster."
}

# Use an existing Resource Group provided by the pipeline
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Use an existing Azure Container Registry
data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Use an existing AKS cluster
data "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name
  resource_group_name = data.azurerm_resource_group.rg.name
}

# If role assignment between AKS and ACR is required, manage it outside or import